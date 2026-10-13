import { useState, useEffect } from "react";
import googleLogo from "../../assets/google-logo.png";
import fallbackReviews, { yandexReviews } from "./reviewsData";
import MasonryReviews from "./MasonryReviews";

function GoogleReviews() {
  const [reviews, setReviews] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch("/api/reviews", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (!cancelled && data.reviews && data.reviews.length > 0) {
          // Cap at 16 — never invent, never exceed what the API gives
          setReviews(data.reviews.slice(0, 16));
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

  // Use API reviews if loaded, otherwise fallback to hardcoded data.
  // Always prepend Yandex reviews so they appear regardless of API status.
  const baseReviews = reviews || fallbackReviews;
  const displayReviews = [...yandexReviews, ...baseReviews];

  return (
    <section
      id="reviews"
      data-aos="fade-up"
      className="bg-gray-50 pt-10 pb-8 overflow-visible"
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

        {/* Reviews Masonry Wall */}

        <div className="mt-6">
          <MasonryReviews reviews={displayReviews} />
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
