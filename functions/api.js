const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Ocp-Apim-Subscription-Key",
  "Cache-Control": "no-store"
};

const UPSTREAM_TIMEOUT_MS = 12000;

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: JSON_HEADERS
    });
  }

  if (request.method !== "GET") {
    return jsonResponse(
      { error: "Methode niet toegestaan" },
      405
    );
  }

  const apiKey = env?.DELIJN_API_KEY?.trim();
  const requestUrl = new URL(request.url);
  const resource = normalizeResource(requestUrl.searchParams.get("resource"));

  if ((resource === "realtime" || resource === "haltes") && !apiKey) {
    return jsonResponse(
      { error: "Serverconfiguratie mist DELIJN_API_KEY" },
      500
    );
  }

  try {
    const upstreamUrl = buildUpstreamUrl(requestUrl, resource);
    const upstreamResponse = await fetchUpstream(upstreamUrl, resource, apiKey);
    const payloadText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
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
    return jsonResponse(parsedPayload, 200);
  } catch (error) {
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
    return await fetchWithTimeout(url, {
      method: "GET",
      headers: requestHeaders
    });
  } catch (error) {
    throw new UpstreamUnavailableError(
      resource === "weather"
        ? "Weerbron is tijdelijk niet bereikbaar"
        : "De Lijn API is tijdelijk niet bereikbaar"
    );
  }
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

function truncate(value, maxLength) {
  const text = (value || "").toString().trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

class RequestValidationError extends Error {}
class UpstreamUnavailableError extends Error {}
