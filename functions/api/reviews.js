/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Google Business Profile Reviews proxy
/*  Route: /api/reviews
/*  Fetches live reviews server-side using OAuth2, caches in-memory.
/*
/*  Reliability design:
/*  • Token refresh and reviews fetch have SEPARATE bounded timeouts
/*    (they used to share one 5s budget, which timed out constantly).
/*  • Access tokens are cached in memory and reused for ~50 min and
/*    deduplicated across concurrent requests.
/*  • Each page fetch has its own per-page timeout via AbortController.
/*  • A "last good" response is remembered separately from the hourly
/*    cache and served as a fallback if Google is slow or down, so the
/*    frontend never loses reviews because of a transient timeout.
/* ------------------------------------------------------------------ */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_REVIEWS_URL =
  "https://mybusiness.googleapis.com/v4" +
  "/accounts/{accountId}/locations/{locationId}/reviews";

/* ── tuning constants ── */

// Fresh cache TTL (serve instantly without calling Google).
const CACHE_TTL_MS = globalThis.__REVIEWS_TEST_CACHE_TTL_MS__ ?? 60 * 60 * 1000; // 1 hour

// How long to keep a "last good" response as a fallback after a failure.
const LAST_GOOD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Access tokens live ~1 hour; reuse for 50 min to stay safely inside expiry.
const TOKEN_REUSE_MS = 50 * 60 * 1000;

// Individual operation timeouts (kept well under the 30s function limit).
// Overridable via globals for fast local testing; production keeps defaults.
const TOKEN_TIMEOUT_MS =
  globalThis.__REVIEWS_TEST_TOKEN_TIMEOUT_MS__ ?? 4000; // OAuth token refresh
const PAGE_TIMEOUT_MS =
  globalThis.__REVIEWS_TEST_PAGE_TIMEOUT_MS__ ?? 3000;  // per page of GBP reviews
const FETCH_TOTAL_TIMEOUT_MS =
  globalThis.__REVIEWS_TEST_FETCH_TOTAL_TIMEOUT_MS__ ?? 12000; // whole reviews-fetch

// Pagination: 5 pages × 20 = up to 100 reviews.  Bounded by the total
// fetch timeout above, so a slow page can't hang the request forever.
const MAX_PAGES = 5;

/* ── caches ── */

let reviewsCache = null;     // fresh hourly cache
let cacheTimestamp = 0;

let lastGoodCache = null;    // last successful response (fallback)
let lastGoodTimestamp = 0;

// In-memory token cache (survives within a single warm instance).
let cachedToken = null;
let cachedTokenExpiry = 0;
let pendingTokenPromise = null; // dedup concurrent token refreshes

// In-flight reviews fetch dedup (one Google burst at a time per instance).
let pendingReviewsPromise = null;

/* ── helpers ── */

const RATING_MAP = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, MAX_RATING_UNSPECIFIED: 0,
};

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

// Fetch with a hard timeout via AbortController.  Returns the Response or
// throws a tagged timeout Error.  Never leaves a hanging connection.
function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(
    () => clearTimeout(timer)
  );
}

/* ── OAuth token ── */

// Exchange refresh token for an access token.  Bounded timeout, and the
// result is cached + deduplicated so concurrent requests share one call.
async function getAccessToken(env) {
  const now = Date.now();

  // Reuse a still-fresh token.
  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  // Deduplicate: if a refresh is already in flight, wait for it.
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    const params = new URLSearchParams({
      client_id: env.GBP_CLIENT_ID,
      client_secret: env.GBP_CLIENT_SECRET,
      refresh_token: env.GBP_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });

    try {
      const res = await fetchWithTimeout(
        GOOGLE_TOKEN_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        },
        TOKEN_TIMEOUT_MS
      );

      if (!res.ok) {
        // Sanitized error only — never log the body or credentials.
        let sanitizedError = null;
        try {
          const errJson = await res.json();
          sanitizedError = {
            error: errJson.error || null,
            error_description: errJson.error_description || null,
          };
        } catch { /* non-JSON body — omit */ }
        console.error("Google token refresh failed", {
          status: res.status,
          error: sanitizedError,
        });
        throw new Error("token_refresh_failed");
      }

      const data = await res.json();
      cachedToken = data.access_token;
      cachedTokenExpiry = now + TOKEN_REUSE_MS;
      return cachedToken;
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}

/* ── reviews fetch ── */

// Fetch a single page of reviews with its own bounded timeout.
async function fetchReviewPage(env, accessToken, url, pageToken) {
  const fullUrl = url.includes("?") ? `${url}&` : `${url}?`;
  let query = `pageSize=20&orderBy=updateTime desc`;
  if (pageToken) query += `&pageToken=${encodeURIComponent(pageToken)}`;

  const res = await fetchWithTimeout(
    `${fullUrl}${query}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
    PAGE_TIMEOUT_MS
  );

  if (!res.ok) {
    const status = res.status;
    console.error("GBP page fetch failed", status);
    throw new Error(`gbp_page_failed_${status}`);
  }

  return res.json();
}

// Fetch reviews from Google Business Profile API with bounded pagination.
// Pages are fetched sequentially but each has a hard timeout, and the whole
// operation is capped by an overall budget so one slow page can't hang.
async function fetchReviewsFromGoogle(env, accessToken) {
  const accountUrl = GBP_REVIEWS_URL.replace("{accountId}", env.GBP_ACCOUNT_ID)
    .replace("{locationId}", env.GBP_LOCATION_ID);

  const allReviews = [];
  let nextPageToken = undefined;
  let aggregate = {};
  const fetchDeadline = Date.now() + FETCH_TOTAL_TIMEOUT_MS;

  for (let page = 0; page < MAX_PAGES; page++) {
    // Stop early if we're approaching the overall budget.
    if (Date.now() > fetchDeadline - PAGE_TIMEOUT_MS) {
      console.warn("Reviews fetch approaching time budget, stopping early", {
        pagesFetched: page,
      });
      break;
    }

    const data = await fetchReviewPage(env, accessToken, accountUrl, nextPageToken);

    if (data.totalReviewCount !== undefined) aggregate.totalReviewCount = data.totalReviewCount;
    if (data.averageRating !== undefined) aggregate.averageRating = data.averageRating;

    if (data.reviews && data.reviews.length > 0) {
      allReviews.push(...data.reviews);
    }

    nextPageToken = data.nextPageToken || undefined;
    if (!nextPageToken) break; // no more pages
  }

  return {
    reviews: allReviews,
    totalReviewCount: aggregate.totalReviewCount,
    averageRating: aggregate.averageRating,
  };
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

// Build the authoritative response with aggregate stats.
function buildResponse(reviews, rawData) {
  const googleTotal =
    rawData && typeof rawData.totalReviewCount === "number"
      ? rawData.totalReviewCount
      : null;
  const totalCount = googleTotal !== null ? googleTotal : reviews.length;

  const googleAvg =
    rawData && typeof rawData.averageRating === "number"
      ? rawData.averageRating
      : null;
  const avgRating =
    googleAvg !== null
      ? googleAvg
      : totalCount > 0
        ? parseFloat(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
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

// Mark the current response as the fallback for future failures.
function rememberAsLastGood(response) {
  lastGoodCache = response;
  lastGoodTimestamp = Date.now();
}

// Return a storable fallback if we have one that isn't too old.
function getLastGoodFallback() {
  if (lastGoodCache && Date.now() - lastGoodTimestamp < LAST_GOOD_TTL_MS) {
    return lastGoodCache;
  }
  return null;
}

/* ── request handler ── */

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

  // Serve fresh cache instantly if available (no Google call at all).
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

  // Try to fetch fresh reviews from Google.
  try {
    let result;

    // Deduplicate concurrent fetches: if a fetch is already in flight,
    // share its result instead of hammering Google a second time.
    if (pendingReviewsPromise) {
      result = await pendingReviewsPromise;
    } else {
      pendingReviewsPromise = (async () => {
        const token = await getAccessToken(env);
        const data = await fetchReviewsFromGoogle(env, token);
        const rawReviews = data.reviews || [];
        const normalized = rawReviews.map(normalizeReview);
        return buildResponse(normalized, data);
      })();

      try {
        result = await pendingReviewsPromise;
      } finally {
        pendingReviewsPromise = null;
      }
    }

    // Success → refresh both the hourly cache and the fallback cache.
    reviewsCache = result;
    cacheTimestamp = now;
    rememberAsLastGood(result);

    return new Response(JSON.stringify({ ...result, cached: false }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Reviews function error:", error.message);

    // Fallback 1: hourly cache may have just expired but still be present.
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

    // Fallback 2: serve the last successful response (up to 7 days old).
    const lastGood = getLastGoodFallback();
    if (lastGood) {
      console.warn("Reviews fetch failed, serving last-good fallback", {
        lastGoodAgeMs: now - lastGoodTimestamp,
      });
      return new Response(
        JSON.stringify({ ...lastGood, cached: true, stale: true }),
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

    // Nothing to fall back to (cold start + Google down).  Categorize the
    // failure for diagnostics without exposing any secrets or tokens.
    let errorCategory = "unknown";
    let upstreamStatus = null;

    if (error.name === "AbortError") {
      // AbortError comes from fetchWithTimeout on a slow response.
      errorCategory = "timeout";
    } else if (error.message === "token_refresh_failed") {
      errorCategory = "token_refresh_failed";
    } else if (
      error.message.startsWith("gbp_page_failed") ||
      error.message.startsWith("GBP API returned")
    ) {
      errorCategory = "gbp_api_error";
      const m = error.message.match(/(\d{3})/);
      if (m) upstreamStatus = parseInt(m[1], 10);
    }

    const diagnostics = { errorCategory };
    if (upstreamStatus !== null) diagnostics.upstreamStatus = upstreamStatus;

    return new Response(
      JSON.stringify({
        error: "Reviews temporarily unavailable",
        reviews: [],
        configured: true,
        diagnostics,
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
