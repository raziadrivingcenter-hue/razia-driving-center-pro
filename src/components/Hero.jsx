import Safe from "../assets/Safe.svg";
import PrimaryButton from "./UI/PrimaryButton";
import FloatingBackground from "./FloatingBackground";
import { TypeAnimation } from "react-type-animation";
import heroImage from "../assets/hero.png";
import courseGuide from "../assets/driving-course-guide.pdf";
import { BookOpen } from "lucide-react";

function Hero({ onBookNow }) {
  return (
    <section
  id="home"
  data-aos="fade-up"
  className="
    relative
    mx-auto
    flex
    min-h-[85vh]
    max-w-7xl
    flex-col
    items-center
    justify-between
    px-6
    pt-32
    pb-16
    md:flex-row
  "
>
      <FloatingBackground />
      {/* Left Side */}
      <div className="max-w-xl">

        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-600">
          ★ Lahore's Trusted Driving School
        </span>

        {/* Main Heading */}
        <h1 className="mt-6 text-6xl font-black leading-tight tracking-tight">
          Drive with
          <br />
          Confidence.
        </h1>

        {/* Animated Text */}
        <div className="mt-6 h-14 flex items-center">
          <TypeAnimation
            sequence={[
              "🚗 Learn from Professionals.",
              2000,
              "⭐ 20+ Years Experience.",
              2000,
              "🎓 Trusted by 5000+ Students.",
              2000,
              "👩 Female Driving Instructor.",
              2000,
            ]}
            wrapper="span"
            speed={45}
            repeat={Infinity}
            className="text-3xl font-bold text-[#FF5A1F]"
          />
        </div>

        <p className="mt-8 max-w-xl text-lg leading-5 text-gray-600">
          Professional one-to-one driving lessons with experienced female
          instructors. Learn confidently on real Lahore roads with thousands
          of successful students.
        </p>

        {/* Buttons */}

<div className="mt-10">

  {/* First Row */}

  <div className="flex flex-wrap gap-4">

    <PrimaryButton onClick={onBookNow}>
      Book Now
    </PrimaryButton>

    <a
      href="#courses"
      className="
      inline-flex
      items-center
      justify-center
      rounded-2xl
      border-2
      border-[#FF6201]
      px-8
      py-4
      font-semibold
      text-[#FF6201]
      transition-all
      duration-300
      hover:-translate-y-1
      hover:bg-[#FF6201]
      hover:text-white
      hover:shadow-xl
      "
    >
      View Courses
    </a>

  </div>

  {/* Second Row */}

  <div className="mt-6 flex flex-col items-start">

    <div className="mb-2 flex items-center gap-2">

      <BookOpen
        size={18}
        className="text-[#FF6201]"
      />

      <span
        className="
        text-sm
        font-bold
        uppercase
        tracking-wide
        text-[#FF6201]
        "
      >
        FREE Guide
      </span>

    </div>

    <a
      href={courseGuide}
      download="Razia-Driving-Center-Course-Guide.pdf"
      className="
      inline-flex
      items-center
      justify-center
      rounded-2xl
      bg-gradient-to-r
      from-[#FF3131]
      to-[#FF6201]
      px-8
      py-4
      font-semibold
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:-translate-y-1
      hover:scale-105
      hover:shadow-2xl
      "
    >
      Download PDF
    </a>

  </div>

</div>

        {/* Safety Statement */}

<div className="mt-12 flex items-center gap-5">

  <img
  src={Safe}
  alt="Safe Driving"
  draggable={false}
  className="
    w-14
    select-none
    drop-shadow-[0_0_15px_rgba(34,197,94,0.35)]
    transition-all
    duration-300
    hover:scale-105
  "
/>

  <div className="h-12 w-px bg-gradient-to-b from-[#FF3131] to-[#FF6201]" />

  <p className="max-w-sm text-[15px] leading-4 text-gray-600">
  Learn defensive driving techniques that build lifelong confidence,
  responsibility, and road safety for you and your family.
</p>

</div>
</div>

{/* Right Side */}

<div className="relative mt-16 flex justify-center md:mt-0">

  <img
    src={heroImage}
    alt="Professional Driving Lesson"
    className="
      h-[540px]
      w-[470px]
      rounded-3xl
      object-cover
      shadow-2xl
      transition-all
      duration-500
      hover:scale-105
      hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]
    "
  />

  <div
    className="
      absolute
      -bottom-6
      -left-6
      rounded-2xl
      border
      border-white/30
      bg-white/50
      backdrop-blur-xl
      p-5
      shadow-[0_12px_35px_rgba(0,0,0,0.18)]
      transition-all
      duration-300
      hover:-translate-y-2
      hover:bg-white/60
      hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)]
    "
  >

    <h3 className="text-lg font-black text-gray-900">
      5,000+ Successful Drivers
    </h3>

    <p className="mt-1 text-sm text-gray-600">
      Driving with Confidence Across Lahore
    </p>

  </div>

</div>

    </section>
  );
}

export default Hero;