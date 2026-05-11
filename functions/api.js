const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Ocp-Apim-Subscription-Key",
  "Cache-Control": "no-store"
};

const UPSTREAM_TIMEOUT_MS = 12000;
const REALTIME_EDGE_CACHE_TTL_SECONDS = 20;
const REALTIME_EDGE_STALE_WINDOW_SECONDS = 180;

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: JSON_HEADERS
    });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Methode niet toegestaan" }, 405);
  }

  const apiKey = env?.DELIJN_API_KEY?.trim();
  const requestUrl = new URL(request.url);
  const resource = normalizeResource(requestUrl.searchParams.get("resource"));

  if ((resource === "realtime" || resource === "haltes") && !apiKey) {
    return jsonResponse({ error: "Serverconfiguratie mist DELIJN_API_KEY" }, 500);
  }

  try {
    const upstreamUrl = buildUpstreamUrl(requestUrl, resource);
    const cache = resource === "realtime" ? caches.default : null;
    const cacheKey = resource === "realtime" ? buildRealtimeCacheKey(requestUrl) : null;
    const upstreamResponse = await fetchUpstream(upstreamUrl, resource, apiKey);
    const payloadText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      if (resource === "realtime" && isTemporaryUpstreamStatus(upstreamResponse.status)) {
        const staleResponse = await matchCachedRealtimeResponse(cache, cacheKey);
        if (staleResponse) return staleResponse;
      }

      return jsonResponse(
        {
          error: resource === "weather" ? "Fout van weerbron" : "Fout van De Lijn API",
          status: upstreamResponse.status,
          upstreamUrl,
          detail: truncate(payloadText, 240)
        },
        upstreamResponse.status
      );
    }

    const parsedPayload = payloadText ? JSON.parse(payloadText) : {};
    if (resource === "realtime" && cache && cacheKey) {
      await storeCachedRealtimeResponse(cache, cacheKey, parsedPayload);
    }
    return jsonResponse(parsedPayload, 200);
  } catch (error) {
    if (resource === "realtime" && error instanceof UpstreamUnavailableError) {
      const staleResponse = await matchCachedRealtimeResponse(caches.default, buildRealtimeCacheKey(requestUrl));
      if (staleResponse) return staleResponse;
    }

    const status = error instanceof RequestValidationError
      ? 400
      : error instanceof UpstreamUnavailableError
        ? 503
        : 500;

    return jsonResponse(
      {
        error: error instanceof RequestValidationError
          ? error.message
          : error instanceof UpstreamUnavailableError
            ? error.message
            : "Fout bij ophalen data",
        detail: error instanceof Error ? truncate(error.message, 240) : ""
      },
      status
    );
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function normalizeResource(value) {
  const normalized = (value || "realtime").toString().trim().toLowerCase();
  if (normalized === "weather" || normalized === "haltes" || normalized === "realtime") {
    return normalized;
  }
  throw new RequestValidationError("Onbekende resource");
}

async function fetchUpstream(url, resource, apiKey) {
  const requestHeaders = {
    Accept: "application/json"
  };

  if (resource === "realtime" || resource === "haltes") {
    requestHeaders["Ocp-Apim-Subscription-Key"] = apiKey;
  }

  try {
    return await fetchWithRetries(url, {
      method: "GET",
      headers: requestHeaders
    });
  } catch (_) {
    throw new UpstreamUnavailableError(
      resource === "weather"
        ? "Weerbron is tijdelijk niet bereikbaar"
        : "De Lijn API is tijdelijk niet bereikbaar"
    );
  }
}

async function fetchWithRetries(url, options = {}, retries = 1) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (!isTemporaryUpstreamStatus(response.status) || attempt === retries) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }

    await wait(450 * (attempt + 1));
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Upstream request mislukt");
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort("timeout"), UPSTREAM_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function buildUpstreamUrl(requestUrl, resource) {
  if (resource === "weather") {
    const latitude = Number.parseFloat(requestUrl.searchParams.get("latitude"));
    const longitude = Number.parseFloat(requestUrl.searchParams.get("longitude"));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new RequestValidationError("Ontbrekende of ongeldige latitude/longitude");
    }

    const upstreamUrl = new URL("https://api.open-meteo.com/v1/forecast");
    upstreamUrl.searchParams.set("latitude", String(latitude));
    upstreamUrl.searchParams.set("longitude", String(longitude));
    upstreamUrl.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m"
    );
    upstreamUrl.searchParams.set("timezone", "auto");
    upstreamUrl.searchParams.set("forecast_days", "1");
    return upstreamUrl.toString();
  }

  if (resource === "haltes") {
    const zoekArgument = requestUrl.searchParams.get("zoekArgument")?.trim();
    if (!zoekArgument) {
      throw new RequestValidationError("Ontbrekend zoekArgument");
    }

    const upstreamUrl = new URL(`https://api.delijn.be/DLZoekOpenData/v1/zoek/haltes/${encodeURIComponent(zoekArgument)}`);
    const huidigePositie = requestUrl.searchParams.get("huidigePositie")?.trim();
    const startIndex = normalizeIntegerParam(requestUrl.searchParams.get("startIndex"));
    const maxAantalHits = normalizeIntegerParam(requestUrl.searchParams.get("maxAantalHits"));

    if (huidigePositie) upstreamUrl.searchParams.set("huidigePositie", huidigePositie);
    if (startIndex !== null) upstreamUrl.searchParams.set("startIndex", String(startIndex));
    if (maxAantalHits !== null) upstreamUrl.searchParams.set("maxAantalHits", String(maxAantalHits));
    return upstreamUrl.toString();
  }

  return "https://api.delijn.be/gtfs/v3/realtime?json=true&delay=true&position=true";
}

function normalizeIntegerParam(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function buildRealtimeCacheKey(requestUrl) {
  return new Request(`${requestUrl.origin}/__cache/realtime`, { method: "GET" });
}

async function storeCachedRealtimeResponse(cache, cacheKey, payload) {
  const cacheHeaders = new Headers(JSON_HEADERS);
  cacheHeaders.set("Cache-Control", `public, max-age=${REALTIME_EDGE_CACHE_TTL_SECONDS}, stale-while-revalidate=${REALTIME_EDGE_STALE_WINDOW_SECONDS}`);
  cacheHeaders.set("X-Busbibliotheek-Realtime-Cache", "fresh");
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: cacheHeaders
    })
  );
}

async function matchCachedRealtimeResponse(cache, cacheKey) {
  if (!cache || !cacheKey) return null;
  const cached = await cache.match(cacheKey);
  if (!cached) return null;

  const headers = new Headers(cached.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Busbibliotheek-Realtime-Cache", "stale");
  return new Response(cached.body, {
    status: 200,
    headers
  });
}

function isTemporaryUpstreamStatus(status) {
  return status === 502 || status === 503 || status === 504;
}

function truncate(value, maxLength) {
  const text = (value || "").toString().trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RequestValidationError extends Error {}
class UpstreamUnavailableError extends Error {}
