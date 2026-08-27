import Safe from "../assets/Safe.svg";
import PrimaryButton from "./UI/PrimaryButton";
import FloatingBackground from "./FloatingBackground";
import { TypeAnimation } from "react-type-animation";
import courseGuide from "../assets/driving-course-guide.pdf";
import { BookOpen, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CourseCard from "./CourseCard";
import { courses } from "../data/courses";

function Hero({ onBookNow }) {
  // Top 3 courses — "Most Selling / Public Favorite" (Economy) is already first.
  const showcaseCourses = courses.slice(0, 3);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia) &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Auto-rotate the stack every 3.5s. Pauses on hover, and stops entirely
  // when the user prefers reduced motion.
  useEffect(() => {
    if (paused || reduceMotion) return undefined;

    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % showcaseCourses.length);
    }, 3500);

    return () => clearInterval(id);
  }, [paused, reduceMotion, showcaseCourses.length]);

  // Stack transforms keyed by depth: 0 = front, 1 = middle, 2 = back.
  const stackStyle = (depth) => {
    const configs = {
      0: { scale: 1, y: 0, rotate: 0, opacity: 1, z: 30 },
      1: { scale: 0.94, y: 14, rotate: 3, opacity: 0.9, z: 20 },
      2: { scale: 0.88, y: 30, rotate: 6, opacity: 0.78, z: 10 },
    };
    return configs[depth];
  };

  return (
    <section
  id="home"
  data-aos="fade-up"
  className="
    relative
    mx-auto
    flex
    min-h-[72vh]
    max-w-7xl
    flex-col
    items-center
    justify-between
    px-6
    pt-24
    pb-10
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
        <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight">
          Drive with
          <br />
          Confidence.
        </h1>

        {/* Animated Text */}
        <div className="mt-4 h-12 flex items-center">
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
            className="text-2xl font-semibold text-[#FF5A1F]"
          />
        </div>

        <p className="mt-5 max-w-lg text-[15px] leading-5 text-gray-600">
          Professional one-to-one driving lessons with experienced female
          instructors. Learn confidently on real Lahore roads with thousands
          of successful students.
        </p>

        {/* Buttons */}

<div className="mt-6">

  {/* First Row */}

  <div className="flex flex-wrap gap-4">

    <PrimaryButton onClick={onBookNow} className="!px-6 !py-2.5 text-sm">
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
      px-6
      py-2.5
      text-sm
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

  {/* Promotional Offer */}
  <div className="mt-4 inline-flex items-center gap-2">
    <span className="rounded-full border border-[#FF6201]/40 bg-[#FF6201]/10 px-3 py-1.5 text-sm font-bold text-[#FF6201]">
      <span className="font-black">FREE</span> Pick & Drop upto{" "}
      <span className="font-black">2 KM</span>
    </span>

    <span className="rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      Limited Offer!
    </span>
  </div>

  {/* No Hidden Charges */}
  <div className="mt-3 inline-flex items-center gap-1.5">
    <ShieldCheck size={15} className="text-[#FF6201]" />
    <span className="rounded-full border border-[#FF6201]/40 bg-[#FF6201]/10 px-3 py-1 text-sm font-bold text-[#FF6201]">
      No Hidden Charges
    </span>
  </div>

  {/* Payment Reassurance */}
  <div className="mt-3">
    <span
      className="
        bg-gradient-to-r
        from-[#FF3131]
        to-[#FF6201]
        bg-clip-text
        text-transparent
        text-sm
        font-bold
        tracking-wide
      "
    >
      Payment on arrival
    </span>
    <p className="mt-0.5 text-[11px] text-gray-500">
      No Card or Online Payment Required
    </p>
    <p className="mt-0.5 text-[11px] text-gray-500">
      Pay only for the actual training and needs you choose — no hidden
      charges, no surprise fees.
    </p>
  </div>

  {/* Second Row */}

  <div className="mt-5 flex flex-col items-start">

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
      px-6
      py-2.5
      text-sm
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

<div className="mt-7 flex items-center gap-5">

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

{/* Right Side — rotating course card stack */}

<div
  className="relative mt-12 flex justify-center md:mt-0"
  onMouseEnter={() => setPaused(true)}
  onMouseLeave={() => setPaused(false)}
>
  <div className="relative h-[600px] w-[300px] sm:w-[320px]">
    {showcaseCourses.map((course, index) => {
      // Depth: how far behind the front this card currently sits.
      const depth =
        (index - activeIndex + showcaseCourses.length) %
        showcaseCourses.length;
      const style = stackStyle(depth);
      const isFront = depth === 0;

      return (
        <motion.div
          key={course.name}
          animate={{
            scale: style.scale,
            y: style.y,
            rotate: style.rotate,
            opacity: style.opacity,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="absolute left-0 top-0 w-full"
          style={{ zIndex: style.z }}
        >
          <CourseCard
            name={course.name}
            title={course.title}
            oldPrice={course.oldPrice}
            price={course.price}
            duration={course.duration}
            features={course.features}
            badge={course.badge}
            titleIcon={course.titleIcon}
            onBook={isFront ? onBookNow : undefined}
          />
        </motion.div>
      );
    })}
  </div>

  {/* Floating trust badge — repositioned to hover by the card stack */}
  <div
    className="
      absolute
      -bottom-8
      left-1/2
      -translate-x-1/2
      rounded-2xl
      border
      border-white/30
      bg-white/60
      backdrop-blur-xl
      px-5
      py-3
      shadow-[0_12px_35px_rgba(0,0,0,0.18)]
      transition-all
      duration-300
      hover:-translate-y-1
      hover:bg-white/70
    "
  >
    <h3 className="text-center text-lg font-black text-gray-900">
      5,000+ Successful Drivers
    </h3>

    <p className="mt-0.5 text-center text-sm text-gray-600">
      Driving with Confidence Across Lahore
    </p>
  </div>
</div>

    </section>
  );
}

export default Hero;