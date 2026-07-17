import instructorImage from "../../assets/instructor/instructor.png";

import InstructorBadges from "./InstructorBadges";
import InstructorStats from "./InstructorStats";

function Instructor() {
  return (
    <section
      id="instructor"
      data-aos="fade-up"
      className="bg-white py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="text-center">

          <span
            className="
              rounded-full
              bg-orange-100
              px-5
              py-2
              font-semibold
              text-[#FF6201]
            "
          >
            Meet Your Instructor
          </span>

          <h2
            className="
              mt-6
              text-5xl
              font-black
              text-gray-900
            "
          >
            Learn From Experience.
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-3xl
              text-lg
              leading-8
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
            mt-2
            grid
            items-center
            gap-6
            lg:grid-cols-2
          "
        >

          {/* LEFT */}

<div className="relative">

  {/* Background Glow */}

  <div
    className="
      absolute
      -left-10
      top-10
      h-72
      w-72
      rounded-full
      bg-[#FF6201]
      opacity-10
      blur-[90px]
    "
  />

  <div
    className="
      absolute
      -right-10
      bottom-10
      h-60
      w-60
      rounded-full
      bg-[#FF3131]
      opacity-10
      blur-[90px]
    "
  />

  <img
    src={instructorImage}
    alt="Madam Razia"
    className="
      w-full
      rounded-[35px]
      shadow-2xl
      transition-all
      duration-500
      hover:scale-[1.02]
    "
  />

  {/* Experience Badge */}

  <div
    className="
      absolute
      -top-8
      -left-8
      rounded-3xl
      border
      border-white/30
      bg-white/20
      backdrop-blur-xl
      px-6
      py-5
      shadow-2xl
    "
  >

    <h3 className="text-3xl font-black text-[#FF6201]">
      20+
    </h3>

    <p className="font-semibold text-gray-800">
      Years Experience
    </p>

  </div>

  {/* Google Rating */}

  <div
    className="
      absolute
      -bottom-8
      -right-8
      rounded-3xl
      border
      border-white/30
      bg-white/20
      backdrop-blur-xl
      px-6
      py-5
      shadow-2xl
    "
  >

    <div className="text-yellow-500 text-xl">

      ★★★★★

    </div>

    <h3 className="text-3xl font-black">
      5.0
    </h3>

    <p className="text-gray-700">

      Google Rating

    </p>

  </div>

</div>

          {/* RIGHT */}

          <div>

            <h3
              className="
                text-4xl
                font-black
                text-gray-900
              "
            >
              Madam Razia
            </h3>

            <p
              className="
                mt-2
                text-xl
                font-semibold
                text-[#FF6201]
              "
            >
              Professional Female Driving Instructor
            </p>

            <p
              className="
                mt-2
                leading-5
                text-gray-600
              "
            >
              With more than two decades of professional driving instruction,
              Madam Razia has helped thousands of beginners become confident,
              responsible and independent drivers.
            </p>

            <p
              className="
                mt-2
                leading-5
                text-gray-600
              "
            >
              Every lesson is conducted patiently, focusing on confidence,
              safety and real traffic experience so students can drive
              independently in everyday situations.
            </p>

            {/* Personal Message */}

            <div
              className="
                mt-4
                rounded-3xl
                border-l-4
                border-[#FF6201]
                bg-orange-50
                p-6
              "
            >

              <h4
                className="
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                A Personal Message
              </h4>

              <p
                className="
                  mt-3
                  italic
                  leading-5
                  text-gray-600
                "
              >
                "Every student deserves confidence behind the steering wheel.
                My goal is to make learning enjoyable, safe and stress-free for
                every learner."
              </p>

              <p
                className="
                  mt-5
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

{/* CTA */}

<div className="mt-12 flex flex-wrap gap-5">

  

  

</div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Instructor;