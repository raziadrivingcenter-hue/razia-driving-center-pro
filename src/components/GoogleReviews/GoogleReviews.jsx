import { useState, useEffect } from "react";
import googleLogo from "../../assets/google-logo.png";
import { yandexReviews } from "./reviewsData";
import cachedReviewsData from "../../data/cached-reviews.json";
import MasonryReviews from "./MasonryReviews";
import MarqueeReviews from "./MarqueeReviews";

// Convert an ISO timestamp to a relative-time string, matching the format
// the /api/reviews endpoint produces (so cached reviews render identically).
function toRelativeTime(isoString) {
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
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

// Real Google reviews captured from the API, used as the local fallback
// when the live endpoint is slow or unavailable. Normalized to the same
// shape the API returns (photoUrl, relative time, verified flag) so the
// ReviewCard component renders them identically.
const cachedReviews = (cachedReviewsData.reviews || []).map((r) => ({
  id: r.id,
  name: r.name,
  rating: r.rating,
  time: toRelativeTime(r.time),
  verified: true,
  review: r.review,
  photoUrl: r.photo || null,
}));

function GoogleReviews() {
  const [reviews, setReviews] = useState(null); // null = loading
  // Detect reduced-motion preference (lazy init avoids setState-in-effect)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Live-update if the user toggles the OS setting during the session
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        const controller = new AbortController();
        // 8s: long enough to receive live reviews even when the API has to
        // refresh its OAuth token + fetch a page or two; the API itself has
        // a ~12s server-side budget and serves stale cache beyond that.
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch("/api/reviews", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Use whatever the API returns (supports 40+ via server-side pagination).
        // Never invent reviews — only use real data the endpoint provides.
        if (!cancelled && data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
        // If empty or not configured, silently use fallback below
      } catch (error) {
        console.warn("Reviews fetch failed, using fallback:", error.message);
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reviews that must never be shown (spam / off-topic), matched by name.
  const BLOCKED_NAMES = ["dream girl"];

  const isBlocked = (r) =>
    BLOCKED_NAMES.includes((r.name || r.author_name || "").toLowerCase());

  // Use API reviews if loaded, otherwise fallback to cached real reviews.
  // Always prepend Yandex reviews so they appear regardless of API status.
  const baseReviews = (reviews || cachedReviews).filter((r) => !isBlocked(r));
  const displayReviews = [
    ...yandexReviews.filter((r) => !isBlocked(r)),
    ...baseReviews,
  ];

  return (
    <section
      id="reviews"
      data-aos="fade-up"
      className="bg-gray-50 pt-10 pb-8 overflow-visible"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="relative mx-auto max-w-6xl overflow-visible px-6">

        {/* Header */}

        <div className="mx-auto max-w-4xl text-center overflow-visible">

          {/* Google Badge */}

          <div
            className="
              inline-flex
              items-center
              gap-3
              rounded-full
              bg-white
              px-4
              py-2
              shadow-md
              border
              border-gray-100
            "
          >

            <img
              src={googleLogo}
              alt="Google"
              width="40"
              height="40"
              className="h-8 w-8"
            />

            <div className="text-left">

              <h2 className="text-base font-black text-gray-900">
                Google Reviews
              </h2>

              <p className="text-xs text-gray-500">
                Verified Customer Reviews
              </p>

            </div>

          </div>

          <h3 className="mt-4 text-xl font-black leading-tight text-gray-900 md:text-2xl">
            Trusted by Thousands of Happy Drivers
          </h3>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-[1.45] text-gray-600">
            Real experiences from students who learned safe and confident
            driving with Razia Driving Center.
          </p>

        </div>

        {/* Reviews — animated marquee, or static masonry for reduced motion */}

        <div className="mt-6">
          {prefersReducedMotion ? (
            <MasonryReviews reviews={displayReviews} />
          ) : (
            <MarqueeReviews reviews={displayReviews} />
          )}
        </div>

        {/* CTA */}

        <div className="mt-6 text-center">

          <a
            href="https://share.google/6OHvakV1zgMD9RUFv"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-5
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-md
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            View All Google Reviews →
          </a>

        </div>

      </div>
    </section>
  );
}

export default GoogleReviews;
