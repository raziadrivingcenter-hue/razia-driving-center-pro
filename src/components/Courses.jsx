import { MapPin } from "lucide-react";

import SectionTitle from "./UI/SectionTitle";
import CustomCourseCard from "./CustomCourseCard";
import CourseCard from "./CourseCard";
import { courses } from "../data/courses";

function Courses({ onCustomBooking }) {
  return (
    <section
      id="courses"
      data-aos="fade-up"
      className="bg-gray-50 py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl px-6">

        <SectionTitle
          badge="Professional Courses"
          title="Choose Your Driving Course"
          subtitle="One-to-one driving lessons designed to help you become a safe and confident driver on Lahore's roads."
        />

        {/* Standard Courses */}

        <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6">

          {courses.map((course) => (

            <CourseCard
              key={course.name}
              {...course}
              popular={course.name === "Economy Driving Course"}
              onBook={onCustomBooking}
            />

          ))}

        </div>

        {/* Pick & Drop Info */}

        <div
          className="mx-auto mt-10 max-w-6xl"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">

              {/* Left — Icon & Heading */}

              <div className="flex items-start gap-4 md:w-1/3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF6201]">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Pick &amp; Drop at Your Doorstep
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No need to travel to us.
                  </p>
                </div>
              </div>

              {/* Right — Details */}

              <div className="flex-1 space-y-2 text-sm text-gray-600 md:text-base">
                <p>
                  The instructor picks you from your home, teaches on real roads
                  in <strong className="text-gray-900">your own area</strong>, then
                  drops you back after every lesson. Training happens where you
                  will actually drive — not at our center.
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-[#FF6201]">&#x2022;</span>
                    Available across Lahore
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-[#FF6201]">&#x2022;</span>
                    Up to 20 km radius
                  </span>
                  <span className="flex items-center gap-1.5">
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

          <CustomCourseCard
            onBook={onCustomBooking}
          />

        </div>

        {/* Practice game promo */}

        <div className="mx-auto mt-6 max-w-6xl">
          <a
            href="/driving-test-practice/"
            className="
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              transition-shadow
              duration-200
              hover:shadow-md
            "
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Practise the L-Track &amp; Parking
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                A free top-down driving game — reverse into the L and park in
                the bay. Desktop keyboard practice.
              </p>
            </div>
            <span
              className="
                shrink-0
                rounded-md
                bg-gray-900
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-colors
                duration-200
                hover:bg-gray-800
              "
            >
              Play →
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}

export default Courses;
