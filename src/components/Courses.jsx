import CustomCourseCard from "./CustomCourseCard";
import SectionTitle from "./UI/SectionTitle";
import GlowCard from "./GlowCard";
import CourseCard from "./CourseCard";
import { courses } from "../data/courses";

function Courses({ onCustomBooking }) {
  return (
    <section
      id="courses"
      data-aos="fade-up"
      className="bg-gray-50 py-8 md:py-10"
    >
      <div className="mx-auto max-w-6xl px-6">

        <SectionTitle
          badge="Professional Courses"
          title="Choose Your Driving Course"
          subtitle="One-to-one driving lessons designed to help you become a safe and confident driver on Lahore's roads."
        />

        {/* Standard Courses */}

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">

          {courses.map((course) => (

            <GlowCard key={course.name}>

              <CourseCard
                name={course.name}
                title={course.title}
                oldPrice={course.oldPrice}
                price={course.price}
                duration={course.duration}
                features={course.features}
                badge={course.badge}
                titleIcon={course.titleIcon}
                onBook={onCustomBooking}
              />

            </GlowCard>

          ))}

        </div>

        {/* Pick & Drop Info */}

        <div
          className="mx-auto mt-8 max-w-6xl"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">

              {/* Left — Icon & Heading */}

              <div className="flex items-start gap-4 md:w-1/3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3131] to-[#FF6201] text-white text-2xl">
                  &#x1F697;
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    Pick &amp; Drop at Your Doorstep
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No need to travel to us.
                  </p>
                </div>
              </div>

              {/* Right — Details */}

              <div className="flex-1 space-y-3 text-sm text-gray-600 md:text-base">
                <p>
                  The instructor picks you from your home, teaches on real roads
                  in <strong className="text-gray-900">your own area</strong>, then
                  drops you back after every lesson. Training happens where you
                  will actually drive — not at our center.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-[#FF6201]">&#x2022;</span>
                    Available across Lahore
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-[#FF6201]">&#x2022;</span>
                    Up to 20 km radius
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-[#FF6201]">&#x2022;</span>
                    First 2 km free on PLUS Plan
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Charge: distance (km) &times; 50 &times; course days &times; 2.
                  <a href="/driving-courses-lahore/" className="ml-1 font-semibold text-[#FF6201] underline">
                    Calculate your price
                  </a>
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Custom Course Builder */}

        <div className="mx-auto mt-6 max-w-6xl">

          <GlowCard>

            <CustomCourseCard
              onBook={onCustomBooking}
            />

          </GlowCard>

        </div>

      </div>
    </section>
  );
}

export default Courses;
