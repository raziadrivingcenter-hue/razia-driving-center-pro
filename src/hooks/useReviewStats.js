import { useState, useEffect } from "react";

// ── Google review stats ────────────────────────────────────────────────────
// Shared by every place the site shows a review count (footer, hero, stats
// bar, why-choose, about, instructor, FAQ, service page) so the number is the
// same everywhere and always the live Google Business Profile figure.
//
// The fetch result is cached at module level, so all components share a single
// request per page load instead of each hitting /api/reviews.

// Shown until the endpoint responds. Same fallback the footer has always used.
const FALLBACK = { rating: "5.0", count: 136 };

let cachedStats = null;
let pendingRequest = null;

function toStats(data) {
  const count = Number(data?.totalReviewCount ?? data?.totalCount);
  if (!Number.isFinite(count) || count <= 0) return null;

  const rating = Number(data?.averageRating);
  return {
    rating: Number.isFinite(rating) ? rating.toFixed(1) : FALLBACK.rating,
    count,
  };
}

export function useReviewStats() {
  const [stats, setStats] = useState(cachedStats || FALLBACK);

  useEffect(() => {
    // Already loaded (or another component is loading it) — nothing to fetch.
    if (cachedStats) return;

    let cancelled = false;

    if (!pendingRequest) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      pendingRequest = fetch("/api/reviews", { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then(toStats)
        .catch(() => null)
        .finally(() => {
          clearTimeout(timeoutId);
          pendingRequest = null;
        });
    }

    pendingRequest.then((live) => {
      if (cancelled || !live) return;
      cachedStats = live;
      setStats(live);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
