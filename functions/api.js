const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Ocp-Apim-Subscription-Key",
  "Cache-Control": "no-store"
};

const UPSTREAM_TIMEOUT_MS = 6000;
const REALTIME_EDGE_CACHE_TTL_SECONDS = 25;
const REALTIME_EDGE_STALE_WINDOW_SECONDS = 300;
const MAX_RESPONSE_SIZE_BYTES = 8388608; // 8MB limit for realtime data
const REQUEST_DEDUP_MAP = new Map();

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
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
    // Check cache FIRST for realtime data
    if (resource === "realtime") {
      const cached = await getRealtimeFromCache();
      if (cached) return cached;
    }

    const cacheKey = resource === "realtime" ? buildRealtimeCacheKey(requestUrl) : null;
    
    // Deduplicate concurrent requests to same resource
    const dedupKey = `${resource}:${buildUpstreamUrl(requestUrl, resource)}`;
    if (REQUEST_DEDUP_MAP.has(dedupKey)) {
      return await REQUEST_DEDUP_MAP.get(dedupKey);
    }

    // Create promise for this request
    const requestPromise = (async () => {
      try {
        const upstreamUrl = buildUpstreamUrl(requestUrl, resource);
        const upstreamResponse = await fetchUpstream(upstreamUrl, resource, apiKey);

        if (!upstreamResponse.ok) {
          if (isTemporaryUpstreamStatus(upstreamResponse.status)) {
            const staleCache = await getRealtimeFromCache(true); // Try stale cache
            if (staleCache) return staleCache;
          }

          const errorText = await readErrorText(upstreamResponse);
          return jsonResponse(
            {
              error: resource === "weather" ? "Fout van weerbron" : "Fout van De Lijn API",
              status: upstreamResponse.status,
              detail: truncate(errorText, 200)
            },
            upstreamResponse.status
          );
        }

        // Stream response or parse for caching
        if (resource === "realtime") {
          try {
            const payloadText = await readWithSizeLimit(upstreamResponse);
            const payload = payloadText ? JSON.parse(payloadText) : {};
            
            // Cache asynchronously without blocking response
            if (cacheKey && payloadText.length < 5000000) { // Cache if < 5MB
              context.waitUntil(storeCachedRealtimeResponse(cacheKey, payload));
            }
            
            return jsonResponse(payload, 200);
          } catch (readError) {
            // If reading fails, try stale cache
            const staleCache = await getRealtimeFromCache(true);
            if (staleCache) return staleCache;
            
            throw readError;
          }
        } else {
          // For other resources, stream directly
          return new Response(upstreamResponse.body, {
            status: 200,
            headers: JSON_HEADERS
          });
        }
      } finally {
        REQUEST_DEDUP_MAP.delete(dedupKey);
      }
    })();

    // Store dedup promise briefly
    REQUEST_DEDUP_MAP.set(dedupKey, requestPromise);
    setTimeout(() => REQUEST_DEDUP_MAP.delete(dedupKey), 100);

    return await requestPromise;
  } catch (error) {
    if (resource === "realtime") {
      const staleCache = await getRealtimeFromCache(true);
      if (staleCache) return staleCache;
    }

    const status = error instanceof RequestValidationError ? 400 : 503;
    return jsonResponse(
      {
        error: error instanceof RequestValidationError
          ? error.message
          : "Fout bij ophalen data",
        detail: error instanceof Error ? truncate(error.message, 200) : ""
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

async function getRealtimeFromCache(allowStale = false) {
  try {
    const cache = caches.default;
    const cacheKey = new Request("https://api.busbibliotheek.local/__cache/realtime", { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (!cached) return null;

    const cacheControl = cached.headers.get("Cache-Control") || "";
    const isStale = cached.headers.get("X-Busbibliotheek-Realtime-Cache") === "stale";
    
    if (isStale && !allowStale) return null;
    
    const response = new Response(cached.body, { status: 200, headers: JSON_HEADERS });
    response.headers.set("X-Busbibliotheek-Cache", isStale ? "stale" : "fresh");
    return response;
  } catch {
    return null;
  }
}

async function readErrorText(response) {
  try {
    const text = await response.text();
    return text.slice(0, 500); // Limit error details
  } catch {
    return "Onbekende fout";
  }
}

async function readWithSizeLimit(response) {
  try {
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    
    // If server tells us size, check early
    if (contentLength > 0 && contentLength > MAX_RESPONSE_SIZE_BYTES) {
      throw new Error(`Response size ${contentLength} exceeds limit`);
    }

    // For streaming, read in chunks
    const reader = response.body?.getReader();
    if (!reader) {
      // Fallback to text() if no readable stream
      const text = await response.clone().text();
      if (text.length > MAX_RESPONSE_SIZE_BYTES) {
        throw new Error(`Response exceeds size limit: ${text.length} bytes`);
      }
      return text;
    }

    let received = 0;
    let result = "";
    const decoder = new TextDecoder();
    const chunks = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.length;
        
        // Check size after every chunk
        if (received > MAX_RESPONSE_SIZE_BYTES) {
          reader.cancel();
          throw new Error(`Response exceeds size limit: ${received} bytes > ${MAX_RESPONSE_SIZE_BYTES}`);
        }

        chunks.push(value);
      }

      // Combine chunks
      for (const chunk of chunks) {
        result += decoder.decode(chunk, { stream: true });
      }
      result += decoder.decode(); // Finalize
      
      return result;
    } catch (error) {
      reader.cancel();
      throw error;
    }
  } catch (error) {
    throw new Error("Fout bij lezen response: " + (error instanceof Error ? error.message : "onbekend"));
  }
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
    Accept: "application/json",
    "User-Agent": "Busbibliotheek/1.0"
  };

  if (resource === "realtime" || resource === "haltes") {
    requestHeaders["Ocp-Apim-Subscription-Key"] = apiKey;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      return await fetch(url, {
        method: "GET",
        headers: requestHeaders,
        signal: controller.signal,
        cf: { cacheTtl: 30, cacheEverything: false, mirage: false }
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("API request timeout");
    }
    throw error;
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

  const upstreamUrl = new URL("https://api.delijn.be/gtfs/v3/realtime");
  upstreamUrl.searchParams.set("json", "true");
  upstreamUrl.searchParams.set("delay", "true");
  upstreamUrl.searchParams.set("position", "true");

  const canceled = requestUrl.searchParams.get("canceled");
  const vehicleId = requestUrl.searchParams.get("vehicleid")?.trim();
  const tripId = requestUrl.searchParams.get("tripid")?.trim();

  if (canceled === "true") upstreamUrl.searchParams.set("canceled", "true");
  if (vehicleId) upstreamUrl.searchParams.set("vehicleid", vehicleId);
  if (tripId) upstreamUrl.searchParams.set("tripid", tripId);
  return upstreamUrl.toString();
}

function normalizeIntegerParam(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function buildRealtimeCacheKey() {
  // Use consistent static key for realtime cache
  return new Request("https://api.busbibliotheek.local/__cache/realtime", { method: "GET" });
}

async function storeCachedRealtimeResponse(cacheKey, payload) {
  try {
    const cache = caches.default;
    const cacheHeaders = new Headers(JSON_HEADERS);
    cacheHeaders.set("Cache-Control", `public, max-age=${REALTIME_EDGE_CACHE_TTL_SECONDS}, stale-while-revalidate=${REALTIME_EDGE_STALE_WINDOW_SECONDS}`);
    cacheHeaders.set("X-Busbibliotheek-Realtime-Cache", "fresh");
    cacheHeaders.set("X-Cache-Time", new Date().toISOString());
    
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), { status: 200, headers: cacheHeaders })
    );
  } catch (error) {
    console.error("Cache storage error:", error);
    // Don't throw - cache failure shouldn't break API
  }
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

