/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Google Places (New) API Reviews proxy
/*  Route: /api/reviews
/*  Env vars: GOOGLE_PLACE_ID, GOOGLE_PLACES_API_KEY
/*  Fetches live reviews server-side, caches in-memory (1 hr).
/* ------------------------------------------------------------------ */

const PLACES_API_BASE = "https://places.googleapis.com/v1/places";

// In-memory cache (survives within a single warm function instance)
let reviewsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Normalize a Places (New) review into the frontend's expected shape.
function normalizeReview(apiReview, index) {
  const author = apiReview.authorAttribution || {};
  return {
    id: index + 1,
    name: author.displayName || "Google User",
    rating: apiReview.rating || 5,
    time: apiReview.relativePublishTimeDescription || "",
    verified: true,
    review: apiReview.text?.text || "",
    photoUrl: author.photoUri || null,
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const placeId = env.GOOGLE_PLACE_ID;
  const apiKey = env.GOOGLE_PLACES_API_KEY;

  if (!placeId || !apiKey) {
    return new Response(
      JSON.stringify({
        error: "Reviews not configured",
        reviews: [],
        configured: false,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // Return cached data if fresh
  const now = Date.now();
  if (reviewsCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return new Response(
      JSON.stringify({ ...reviewsCache, cached: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  }

  try {
    const url =
      `${PLACES_API_BASE}/${placeId}` +
      "?fields=name,rating,userRatingsTotal,reviews" +
      `&key=${apiKey}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Places API error:", res.status, errText);
      throw new Error(`Places API returned ${res.status}`);
    }

    const data = await res.json();
    const rawReviews = data.reviews || [];
    const normalized = rawReviews.map(normalizeReview);

    const response = {
      reviews: normalized,
      totalCount: data.userRatingsTotal || normalized.length,
      averageRating: data.rating || 0,
      totalReviewCount: data.userRatingsTotal || normalized.length,
      fetched: true,
    };

    // Update cache
    reviewsCache = response;
    cacheTimestamp = now;

    return new Response(JSON.stringify({ ...response, cached: false }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Reviews function error:", error);

    // Serve stale cache rather than failing outright
    if (reviewsCache) {
      return new Response(
        JSON.stringify({ ...reviewsCache, cached: true, stale: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Reviews temporarily unavailable",
        reviews: [],
        configured: true,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
