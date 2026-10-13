// =============================================================================
// MasonryReviews — Magic UI-style review wall.
// Desktop: CSS columns (3 col @1024-1280, 4 col @1280+)
// Mobile: single stacked column
// Supports Google and Yandex Maps review sources.
// =============================================================================

import { useState } from "react";
import googleLogo from "../../assets/google-logo.png";
import yandexLogo from "../../assets/yandex-logo.png";
import saimaProfile from "../../assets/saima-usman-profile-picture.jpg";

// Local profile-picture lookup (Vite hashes these at build time)
const LOCAL_PROFILES = {
  "saima-usman-profile-picture.jpg": saimaProfile,
};

/* ── Star display ── */
function Stars({ rating }) {
  const full = rating || 5;
  return (
    <span className="flex gap-0.5 text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < full ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/* ── Single review card ── */
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);

  const isYandex = review.source === "yandex";
  const platformLogo = isYandex ? yandexLogo : googleLogo;
  const platformLabel = isYandex ? "Yandex review" : "Google review";
  const platformAlt = isYandex ? "Yandex Maps" : "Google";

  // Resolve profile picture: explicit local asset, API photoUrl, or null
  let profileSrc = null;
  if (review.profilePicture && LOCAL_PROFILES[review.profilePicture]) {
    profileSrc = LOCAL_PROFILES[review.profilePicture];
  } else if (review.photoUrl) {
    profileSrc = review.photoUrl;
  }

  const needsClamp = review.review.length > 160;

  return (
    <article
      {...(isYandex ? { "data-source": "yandex" } : {})}
      className="
        break-inside-avoid
        mb-5
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition-shadow
        duration-300
        hover:shadow-md
      "
    >
      {/* Header: avatar + name + platform badge */}
      <div className="flex items-start gap-3">
        {/* Avatar or initial fallback */}
        {profileSrc ? (
          <img
            src={profileSrc}
            alt={`${review.name} profile photo`}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br
              from-[#FF3131]
              to-[#FF6201]
              text-sm
              font-bold
              text-white
            "
          >
            {review.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-sm font-semibold text-gray-900">
              {review.name}
            </h4>
            <img
              src={platformLogo}
              alt={platformAlt}
              width="16"
              height="16"
              className="h-4 w-4 shrink-0"
            />
          </div>
          <p className="text-xs text-gray-400">{platformLabel}</p>
        </div>
      </div>

      {/* Stars */}
      <div className="mt-3">
        <Stars rating={review.rating} />
        <span className="ml-1.5 text-xs text-gray-500">{review.time}</span>
      </div>

      {/* Review text */}
      <p
        className="mt-3 text-sm leading-relaxed text-gray-600"
        style={
          needsClamp && !expanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {review.review}
      </p>

      {/* Read more */}
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="
            mt-2
            text-xs
            font-semibold
            text-[#FF6201]
            transition-colors
            duration-200
            hover:text-[#FF3131]
          "
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </article>
  );
}

/* ── Skeleton loader ── */
function MasonrySkeleton() {
  return (
    <div
      className="
        columns-1
        gap-5
        sm:columns-2
        lg:columns-3
        xl:columns-4
      "
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="mb-5 break-inside-avoid animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-2 w-16 rounded bg-gray-100" />
            </div>
          </div>
          <div className="mt-3 h-3 w-20 rounded bg-gray-100" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Masonry wall ── */
export default function MasonryReviews({ reviews }) {
  if (!reviews) {
    return <MasonrySkeleton />;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div
      className="
        columns-1
        gap-5
        sm:columns-2
        lg:columns-3
        xl:columns-4
      "
    >
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
