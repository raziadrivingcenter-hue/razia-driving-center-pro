// =============================================================================
//  ReviewsPlaceholder — skeleton for the lazy GoogleReviews section
// =============================================================================
//  GoogleReviews is code-split (see Homepage.jsx). This placeholder keeps the
//  exact same box model as the real section — same section padding, same
//  header copy at the same type scale, same fixed-height marquee slot, same
//  CTA — so when the real section swaps in, nothing on the page moves.
//
//  The header text is real text rendered in skeleton colours (not an empty
//  box) on purpose: identical copy + identical classes means identical line
//  wrapping, which is what makes the height match. It carries no id so there
//  is never a duplicate #reviews in the DOM; Homepage scrolls to the real
//  section once it has mounted.
// =============================================================================

function ReviewsPlaceholder() {
  return (
    <section
      aria-hidden="true"
      className="bg-gray-50 pt-10 pb-8 overflow-visible"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="relative mx-auto max-w-6xl overflow-visible px-6">

        {/* Header — mirrors GoogleReviews */}

        <div className="mx-auto max-w-4xl text-center overflow-visible">

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
            {/* Same 32×32 box the Google logo occupies */}
            <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />

            <div className="text-left">
              <h2 className="text-base font-black text-gray-200">
                Google Reviews
              </h2>
              <p className="text-xs text-gray-100">
                Verified Customer Reviews
              </p>
            </div>
          </div>

          <h3 className="mt-4 text-xl font-black leading-tight text-gray-200 md:text-2xl">
            Trusted by Thousands of Happy Drivers
          </h3>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-[1.45] text-gray-100">
            Real experiences from students who learned safe and confident
            driving with Razia Driving Center.
          </p>

        </div>

        {/* Marquee slot — MarqueeReviews is exactly this height */}

        <div className="mt-6">
          <div className="h-[500px] rounded-xl bg-gray-100 md:h-[600px]" />
        </div>

        {/* CTA — same padding and type scale as the real button */}

        <div className="mt-6 text-center">
          <div className="pointer-events-none inline-flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-bold text-transparent shadow-md">
            View All Google Reviews →
          </div>
        </div>

      </div>
    </section>
  );
}

export default ReviewsPlaceholder;
