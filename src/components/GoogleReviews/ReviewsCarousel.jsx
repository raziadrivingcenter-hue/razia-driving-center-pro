import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./ReviewsCarousel.css";

import reviewsData from "./reviewsData";
import ReviewCard from "./ReviewCard";

function ReviewsCarousel() {
  return (
    <div className="reviews-slider-wrapper">

      {/* Custom Navigation */}

      <div className="review-prev">
        ←
      </div>

      <div className="review-next">
        →
      </div>

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
        {reviewsData.map((review) => (
          <SwiperSlide key={review.id}>
            <ReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  );
}

export default ReviewsCarousel;