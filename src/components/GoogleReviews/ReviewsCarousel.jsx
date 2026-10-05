import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./ReviewsCarousel.css";

import fallbackReviews from "./reviewsData";
import ReviewCard from "./ReviewCard";

function ReviewsSkeleton() {
  return (
    <div className="flex gap-8 justify-center px-10">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-3xl border border-gray-200 bg-white p-7 shadow-lg w-full max-w-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
            </div>
          </div>
          <div className="mt-5 h-3 w-24 rounded bg-gray-100" />
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewsCarousel() {
  const [reviews, setReviews] = useState(null); // null = loading
  const [stats, setStats] = useState(null);

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

        if (!cancelled) {
          if (data.reviews && data.reviews.length > 0) {
            setReviews(data.reviews);
            setStats({
              averageRating: data.averageRating,
              totalReviewCount: data.totalReviewCount,
            });
          }
          // If reviews empty or not configured, we silently use fallback
        }
      } catch (error) {
        // Silently fall back to hardcoded data — never show error to user
        console.warn("Reviews fetch failed, using fallback:", error.message);
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading state
  if (reviews === null && stats === null) {
    return <ReviewsSkeleton />;
  }

  // Use API reviews if available, otherwise fallback to hardcoded data
  const displayReviews = reviews || fallbackReviews;

  return (
    <div className="reviews-slider-wrapper">
      {/* Custom Navigation */}
      <div className="review-prev">←</div>
      <div className="review-next">→</div>

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        className="premium-review-slider"
        spaceBetween={30}
        centeredSlides={true}
        watchSlidesProgress={true}
        loop={true}
        speed={900}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={{
          nextEl: ".review-next",
          prevEl: ".review-prev",
        }}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 3,
          },
        }}
      >
        {displayReviews.map((review) => (
          <SwiperSlide key={review.id}>
            <ReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default ReviewsCarousel;
