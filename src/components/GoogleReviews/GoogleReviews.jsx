import ReviewsCarousel from "./ReviewsCarousel";
import googleLogo from "../../assets/google-logo.png";

function GoogleReviews() {
  return (
    <section
      id="reviews"
      data-aos="fade-up"
      className="bg-gray-50 pt-32 pb-20 overflow-visible"
    >
      <div className="relative mx-auto max-w-7xl overflow-visible px-6">

        {/* Header */}

        <div className="mx-auto max-w-4xl text-center overflow-visible">

          {/* Google Badge */}

          <div
            className="
              inline-flex
              items-center
              gap-4
              rounded-full
              bg-white
              px-7
              py-4
              shadow-xl
              border
              border-gray-100
            "
          >

            <img
              src={googleLogo}
              alt="Google"
              className="h-10 w-10"
            />

            <div className="text-left">

              <h2 className="text-2xl font-black text-gray-900">
                Google Reviews
              </h2>

              <p className="text-sm text-gray-500">
                Verified Customer Reviews
              </p>

            </div>

          </div>

          <h3 className="mt-10 text-4xl font-black text-gray-900">
            Trusted by Thousands of Happy Drivers
          </h3>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">
            Real experiences from students who learned safe and confident
            driving with Razia Driving Center.
          </p>

        </div>

        {/* Reviews Slider */}

        <div className="mt-20">
          <ReviewsCarousel />
        </div>

        {/* CTA */}

        <div className="mt-20 text-center">

          <a
            href="https://share.google/6OHvakV1zgMD9RUFv"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-3
              rounded-2xl
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-8
              py-4
              text-lg
              font-bold
              text-white
              shadow-xl
              transition-all
              duration-300
              hover:-translate-y-1
              hover:scale-105
              hover:shadow-2xl
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