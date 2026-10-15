/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Google Business Profile Reviews proxy
/*  Route: /api/reviews
/*  Fetches live reviews server-side using OAuth2, caches in-memory.
/* ------------------------------------------------------------------ */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_REVIEWS_URL =
  "https://mybusiness.googleapis.com/v4" +
  "/accounts/{accountId}/locations/{locationId}/reviews";

// In-memory cache (survives within a single warm function instance)
let reviewsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Google starRating enum → number
const RATING_MAP = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  MAX_RATING_UNSPECIFIED: 0,
};

// ISO 8601 timestamp → relative time string
function toRelativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

// Exchange refresh token for a fresh access token
async function getAccessToken(env) {
  const params = new URLSearchParams({
    client_id: env.GBP_CLIENT_ID,
    client_secret: env.GBP_CLIENT_SECRET,
    refresh_token: env.GBP_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Google token refresh failed:", res.status, errText);
    throw new Error("Token refresh failed");
  }

  const data = await res.json();
  return data.access_token;
}

// Fetch reviews from Google Business Profile API
async function fetchReviewsFromGoogle(env, accessToken) {
  const url = GBP_REVIEWS_URL.replace("{accountId}", env.GBP_ACCOUNT_ID)
    .replace("{locationId}", env.GBP_LOCATION_ID);

  const separator = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${separator}pageSize=20&orderBy=updateTime desc`;

  const res = await fetch(fullUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("GBP API error:", res.status, errText);
    throw new Error(`GBP API returned ${res.status}`);
  }

  return res.json();
}

// Normalize Google API review → frontend shape
function normalizeReview(apiReview, index) {
  const rating = RATING_MAP[apiReview.starRating] || 5;
  return {
    id: index + 1,
    name: apiReview.reviewer?.displayName || "Google User",
    rating,
    time: toRelativeTime(apiReview.createTime),
    verified: true,
    review: apiReview.comment || "",
    photoUrl: apiReview.reviewer?.profilePhotoUrl || null,
  };
}

// Build the response with aggregate stats.
// rawData is the full Google API response, which provides authoritative
// totalReviewCount and averageRating across ALL reviews for the location.
function buildResponse(reviews, rawData) {
  // totalReviewCount: prefer Google's authoritative value
  const googleTotal =
    rawData && typeof rawData.totalReviewCount === "number"
      ? rawData.totalReviewCount
      : null;
  const totalCount = googleTotal !== null ? googleTotal : reviews.length;

  // averageRating: prefer Google's authoritative value
  const googleAvg =
    rawData && typeof rawData.averageRating === "number"
      ? rawData.averageRating
      : null;
  const avgRating =
    googleAvg !== null
      ? googleAvg
      : totalCount > 0
        ? parseFloat(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1)
          )
        : 5.0;

  return {
    reviews,
    totalCount,
    averageRating: avgRating,
    totalReviewCount: totalCount,
    fetched: true,
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

  // Check if credentials are configured
  const hasCreds =
    env.GBP_CLIENT_ID &&
    env.GBP_CLIENT_SECRET &&
    env.GBP_REFRESH_TOKEN &&
    env.GBP_ACCOUNT_ID &&
    env.GBP_LOCATION_ID;

  if (!hasCreds) {
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
    // Race against a timeout to avoid slow responses
    const TIMEOUT_MS = 5000;
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
    );

    const data = await Promise.race([
      (async () => {
        const token = await getAccessToken(env);
        return fetchReviewsFromGoogle(env, token);
      })(),
      timeout,
    ]);

    const rawReviews = data.reviews || [];
    const normalized = rawReviews.map(normalizeReview);
    const response = buildResponse(normalized, data);

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

    // If we have stale cache, serve it rather than failing
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
