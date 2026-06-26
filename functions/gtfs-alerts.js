const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Ocp-Apim-Subscription-Key",
  "Cache-Control": "no-store"
};

const DEFAULT_DELIJN_API_KEY = "c8d86e3f6d9d40828e5193af47ee4fef";
const UPSTREAM_URL = "https://api-management-opendata-production.azure-api.net/api/gtfs/feed/delijn/rt/alert";
const UPSTREAM_TIMEOUT_MS = 10000;
const GTFS_ALERTS_CACHE_TTL_MS = 10 * 60 * 1000;
const GTFS_ALERTS_COOLDOWN_MS = 30 * 1000;
const GTFS_ALERTS_CACHE = { payload: null, expiresAt: 0, fetchedAt: 0, lastFailureAt: 0, cooldownUntil: 0 };

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Methode niet toegestaan" }, 405);
  }

  const requestUrl = new URL(request.url);
  const format = (requestUrl.searchParams.get("format") || "json").toLowerCase();

  if (!["json", "protobuf"].includes(format)) {
    return jsonResponse({ error: "Ongeldige format-waarde. Gebruik json of protobuf." }, 400);
  }

  const apiKey = (env?.DELIJN_API_KEY || DEFAULT_DELIJN_API_KEY)?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "Geen De Lijn API-key beschikbaar." }, 500);
  }

  const cachedPayload = getCachedAlertsPayload();
  if (isInCooldown()) {
    if (cachedPayload) {
      return jsonResponse({
        ...cachedPayload,
        meta: {
          source: "cache",
          cachedAt: GTFS_ALERTS_CACHE.fetchedAt,
          retryAfterMs: Math.max(0, GTFS_ALERTS_CACHE.cooldownUntil - Date.now())
        }
      }, 200);
    }

    return jsonResponse(buildFallbackPayload("rate-limited", "De Lijn API is tijdelijk beperkt. Er wordt geen nieuwe call gedaan tot de cooldown is verlopen."), 200);
  }

  try {
    const upstreamUrl = new URL(UPSTREAM_URL);
    upstreamUrl.searchParams.set("format", format);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const response = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          Accept: format === "protobuf" ? "application/x-protobuf" : "application/json",
          "Ocp-Apim-Subscription-Key": apiKey,
          "User-Agent": "Busbibliotheek/1.0"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        recordRateLimitFailure(detail, response.status);
        const fallbackPayload = getCachedAlertsPayload();
        if (isQuotaError(detail, response.status)) {
          if (fallbackPayload) {
            return jsonResponse({
              ...fallbackPayload,
              meta: {
                source: "cache",
                cachedAt: GTFS_ALERTS_CACHE.fetchedAt,
                retryAfterMs: GTFS_ALERTS_COOLDOWN_MS
              }
            }, 200);
          }

          return jsonResponse(buildFallbackPayload("rate-limited", detail.slice(0, 500)), 200);
        }

        return jsonResponse(
          {
            error: "Fout bij ophalen GTFS RT Alerts",
            status: response.status,
            detail: detail.slice(0, 500),
            cached: Boolean(fallbackPayload)
          },
          response.status
        );
      }

      if (format === "protobuf") {
        const bytes = await response.arrayBuffer();
        resetRateLimitState();
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "application/x-protobuf",
            "Content-Length": String(bytes.byteLength),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
          }
        });
      }

      const payloadText = await response.text();
      try {
        const payload = JSON.parse(payloadText);
        storeCachedAlertsPayload(payload);
        resetRateLimitState();
        return jsonResponse(payload, 200);
      } catch {
        return jsonResponse({ error: "Ongeldige JSON-response van De Lijn API", raw: payloadText.slice(0, 1000) }, 502);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    return jsonResponse(
      {
        error: "Fout bij ophalen GTFS RT Alerts",
        detail: error instanceof Error ? error.message : "Onbekende fout"
      },
      502
    );
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function getCachedAlertsPayload() {
  if (!GTFS_ALERTS_CACHE.payload) return null;
  if (Date.now() >= GTFS_ALERTS_CACHE.expiresAt) {
    GTFS_ALERTS_CACHE.payload = null;
    return null;
  }
  return GTFS_ALERTS_CACHE.payload;
}

function storeCachedAlertsPayload(payload) {
  GTFS_ALERTS_CACHE.payload = payload;
  GTFS_ALERTS_CACHE.fetchedAt = Date.now();
  GTFS_ALERTS_CACHE.expiresAt = Date.now() + GTFS_ALERTS_CACHE_TTL_MS;
}

function recordRateLimitFailure(detail, status) {
  if (status === 429 || isQuotaError(detail, status)) {
    GTFS_ALERTS_CACHE.cooldownUntil = Date.now() + GTFS_ALERTS_COOLDOWN_MS;
  }
  GTFS_ALERTS_CACHE.lastFailureAt = Date.now();
}

function resetRateLimitState() {
  GTFS_ALERTS_CACHE.lastFailureAt = 0;
  GTFS_ALERTS_CACHE.cooldownUntil = 0;
}

function isInCooldown() {
  return GTFS_ALERTS_CACHE.cooldownUntil > Date.now();
}

function isQuotaError(detail, status) {
  if (status === 403 || status === 429) return true;
  return /quota|call volume|rate limit/i.test(detail || "");
}

function buildFallbackPayload(reason, detail) {
  return {
    alerts: [],
    meta: {
      source: "fallback",
      reason,
      detail,
      timestamp: new Date().toISOString()
    }
  };
}
