// =============================================================================
// MarqueeReviews — Magic UI-inspired 5-column vertical review marquee.
//
// Columns (1-based): 1 ↑  2 ↓  3 ↑  4 ↓  5 ↑
// Each column scrolls continuously with a unique duration so the motion
// never looks mechanically synchronized.  The review list is duplicated once
// per column so the -50% → 0 loop is seamless.
//
// Responsive column count (via viewport hook):
//   < 640px  → 2 columns
//   < 1024px → 3 columns
//   ≥ 1024px → 5 columns
//
// prefers-reduced-motion is handled by the parent (GoogleReviews) which
// swaps this component for the static MasonryReviews layout.
// =============================================================================

import { useState, useEffect } from "react";
import { ReviewCard, MasonrySkeleton } from "./MasonryReviewCard";

/* ── helpers ── */

// Round-robin distribution: review[i] → column[i % columnCount]
function distributeReviews(reviews, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);
  reviews.forEach((review, i) => {
    columns[i % columnCount].push(review);
  });
  return columns;
}

// Direction pattern from the spec: even index = up, odd index = down
// → col 1 (↑) col 2 (↓) col 3 (↑) col 4 (↓) col 5 (↑)
function getDirection(index) {
  return index % 2 === 0 ? "up" : "down";
}

// Varied durations (seconds) so columns don't move in lockstep
const DURATIONS = [28, 32, 30, 35, 27];

// Viewport-driven column count
function useColumnCount() {
  const compute = () => {
    if (typeof window === "undefined") return 5;
    const w = window.innerWidth;
    if (w < 640) return 2;
    if (w < 1024) return 3;
    return 5;
  };

  const [count, setCount] = useState(compute);

  useEffect(() => {
    const handleResize = () => setCount(compute());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return count;
}

/* ── single scrolling column ── */

function MarqueeColumn({ reviews, index }) {
  const direction = getDirection(index);
  const duration = DURATIONS[index % DURATIONS.length];

  // Duplicate the list once for a seamless loop
  const loop = [...reviews, ...reviews];

  return (
    <div className="flex-1 overflow-hidden">
      <div
        className={`flex flex-col gap-4 animate-marquee-${direction}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((review, i) => (
          <div key={`${review.id}-${i}`}>
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── main component ── */

export default function MarqueeReviews({ reviews }) {
  const columnCount = useColumnCount();

  if (!reviews) return <MasonrySkeleton />;
  if (reviews.length === 0) return null;

  const columns = distributeReviews(reviews, columnCount);

  return (
    <div className="relative h-[500px] md:h-[600px]">
      {/* Top fade + subtle blur — blends into the section bg (gray-50) */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 z-10 h-28
          bg-gradient-to-b from-gray-50 to-transparent
          backdrop-blur-[3px]
        "
        aria-hidden="true"
      />
      {/* Bottom fade + subtle blur */}
      <div
        className="
          pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28
          bg-gradient-to-t from-gray-50 to-transparent
          backdrop-blur-[3px]
        "
        aria-hidden="true"
      />

      {/* Scrolling columns */}
      <div key={`marquee-${columnCount}`} className="flex h-full gap-4">
        {columns.map((colReviews, i) => (
          <MarqueeColumn
            key={`col-${i}`}
            reviews={colReviews}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
