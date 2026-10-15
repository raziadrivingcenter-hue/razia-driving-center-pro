// =============================================================================
// MasonryReviews — CSS-columns fallback layout.
// Used for the prefers-reduced-motion path and as a static review wall.
// =============================================================================

import { ReviewCard, MasonrySkeleton } from "./MasonryReviewCard";

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
