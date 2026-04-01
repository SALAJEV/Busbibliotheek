export async function onRequest(context) {
  const API_KEY = context.env?.DELIJN_API_KEY;
  const url = "https://api.delijn.be/gtfs/v3/realtime?json=true&delay=true&position=true";

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Serverconfiguratie mist DELIJN_API_KEY" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": API_KEY,
        "Accept": "application/json"
      },
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Fout van De Lijn API", status: response.status }), {
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
    return new Response(JSON.stringify({ error: "Fout bij ophalen data" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
}
