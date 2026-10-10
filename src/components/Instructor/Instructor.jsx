import instructorImage from "../../assets/instructor/instructor.png";

import InstructorBadges from "./InstructorBadges";
import InstructorStats from "./InstructorStats";

function Instructor() {
  return (
    <section
      id="instructor"
      data-aos="fade-up"
      className="bg-white py-8 md:py-10"
    >
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}

        <div className="text-center">

          <span
            className="
              rounded-full
              bg-orange-100
              px-3
              py-1.5
              text-xs
              font-semibold
              text-[#FF6201]
            "
          >
            Meet Your Instructor
          </span>

          <h2
            className="
              mt-3
              text-2xl
              font-black
              leading-[1.2]
              text-gray-900
              md:text-3xl
            "
          >
            Learn From Experience.
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-2xl
              text-sm
              leading-[1.45]
              text-gray-600
            "
          >
            Learn driving with confidence under the guidance of an experienced
            female instructor trusted by thousands of students across Lahore.
          </p>

        </div>

        {/* Content */}

        <div
          className="
            mt-6
            grid
            items-center
            gap-6
            lg:grid-cols-2
          "
        >

          {/* LEFT */}

          <div className="relative">

            <img
              src={instructorImage}
              alt="Madam Razia"
              width="800"
              height="800"
              loading="lazy"
              decoding="async"
              className="
                w-full
                rounded-2xl
                shadow-lg
              "
            />

            {/* Experience Badge */}

            <div
              className="
                absolute
                -top-3
                -left-3
                rounded-xl
                border
                border-white/30
                bg-white/20
                backdrop-blur-md
                px-4
                py-2.5
                shadow-lg
              "
            >

              <h3 className="text-lg font-black text-[#FF6201]">
                Est. 2016
              </h3>

              <p className="text-xs font-semibold text-gray-800">
                Trusted Since 2016
              </p>

            </div>

            {/* Google Rating */}

            <div
              className="
                absolute
                -bottom-3
                -right-3
                rounded-xl
                border
                border-white/30
                bg-white/20
                backdrop-blur-md
                px-4
                py-2.5
                shadow-lg
              "
            >

              <div className="text-yellow-500 text-sm leading-none">
                ★★★★★
              </div>

              <h3 className="text-lg font-black">
                5.0
              </h3>

              <p className="text-xs text-gray-700">
                133 Google Reviews
              </p>

            </div>

          </div>

          {/* RIGHT */}

          <div>

            <h3
              className="
                text-2xl
                font-black
                leading-tight
                text-gray-900
                md:text-3xl
              "
            >
              Madam Razia
            </h3>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-[#FF6201]
              "
            >
              Professional Female Driving Instructor
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-[1.45]
                text-gray-600
              "
            >
              Since December 2016, Madam Razia has helped thousands of
              beginners become confident, responsible and independent drivers
              across Lahore. Every lesson focuses on confidence, safety and
              real traffic experience.
            </p>

            {/* Personal Message */}

            <div
              className="
                mt-3
                rounded-xl
                border-l-4
                border-[#FF6201]
                bg-orange-50
                p-4
              "
            >

              <h4
                className="
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                A Personal Message
              </h4>

              <p
                className="
                  mt-1.5
                  text-sm
                  italic
                  leading-[1.45]
                  text-gray-600
                "
              >
                "Every student deserves confidence behind the steering wheel.
                My goal is to make learning enjoyable, safe and stress-free for
                every learner."
              </p>

              <p
                className="
                  mt-2
                  text-xs
                  font-bold
                  text-[#FF6201]
                "
              >
                — Madam Razia
              </p>

            </div>

            {/* Badges */}

            <InstructorBadges />

            {/* Stats */}

            <InstructorStats />

          </div>

        </div>

      </div>
    </section>
  );
}

export default Instructor;
