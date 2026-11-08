/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — address search proxy                   */
/*  Route: GET /api/v1/geocode?q=<text>&limit=<1-10>                   */
/*                                                                    */
/*  Talks to Nominatim with the descriptive User-Agent / Referer that */
/*  their usage policy requires. Browsers forbid setting those headers */
/*  from JavaScript, so the request has to go through the server.     */
/*                                                                    */
/*  Results are restricted to Pakistan and biased toward Lahore.      */
/*  Nominatim asks for at most 1 request/second; the client only       */
/*  searches on an explicit submit and enforces that limit itself     */
/*  (see src/lib/geocodingService.js). Self-host for production.      */
/* ------------------------------------------------------------------ */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// Override with the GEOCODING_USER_AGENT / SITE_URL environment variables
// in the Cloudflare Pages dashboard if the contact details change.
const DEFAULT_USER_AGENT =
  "razia-driving-center-pro/1.0 (https://raziadrivingcenter.com; raziadrivingcenter@gmail.com)";
const DEFAULT_SITE_URL = "https://raziadrivingcenter.com";

// Lahore viewport, order left,top,right,bottom (lon,lat). Bounded = 0 so it
// biases results toward the city without hard-excluding the wider metro area.
const VIEWBOX = "74.0,31.82,74.66,31.19";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(params.get("limit")) || 5, 1), 10);

  if (query.length < 3) {
    return json({ results: [] });
  }

  const upstreamParams = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: String(limit),
    countrycodes: "pk",
    "accept-language": "en",
    addressdetails: "0",
    viewbox: VIEWBOX,
    bounded: "0",
  });

  const userAgent = env.GEOCODING_USER_AGENT || DEFAULT_USER_AGENT;
  const siteUrl = env.SITE_URL || DEFAULT_SITE_URL;

  try {
    const upstream = await fetch(
      `${NOMINATIM_BASE_URL}/search?${upstreamParams.toString()}`,
      {
        headers: {
          "User-Agent": userAgent,
          Referer: siteUrl,
          Accept: "application/json",
        },
      }
    );

    if (!upstream.ok) {
      console.error("Nominatim upstream error:", upstream.status);
      return json({ error: "Geocoding service unavailable" }, 502);
    }

    const data = await upstream.json();
    const results = (Array.isArray(data) ? data : [])
      .map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        type: item.type,
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    return json(
      { results },
      200,
      { "Cache-Control": "public, max-age=86400" }
    );
  } catch (error) {
    console.error("Geocode function error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
