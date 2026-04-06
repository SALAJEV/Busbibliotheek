export async function onRequest(context) {
  const API_KEY = context.env?.DELIJN_API_KEY;
  const requestUrl = new URL(context.request.url);
  const resource = requestUrl.searchParams.get("resource") || "realtime";

  if (resource === "realtime" || resource === "haltes") {
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Serverconfiguratie mist DELIJN_API_KEY" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }
  }

  try {
    const upstreamUrl = buildUpstreamUrl(requestUrl, resource);
    const requestHeaders = {
      "Accept": "application/json"
    };

    if (resource === "realtime" || resource === "haltes") {
      requestHeaders["Ocp-Apim-Subscription-Key"] = API_KEY;
    }

    const response = await fetch(upstreamUrl, {
      headers: requestHeaders,
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: resource === "weather" ? "Fout van weerbron" : "Fout van De Lijn API", status: response.status }), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const status = error instanceof RequestValidationError ? 400 : 500;
    return new Response(JSON.stringify({ error: error instanceof RequestValidationError ? error.message : "Fout bij ophalen data" }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
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

class RequestValidationError extends Error {}
