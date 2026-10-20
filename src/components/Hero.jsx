import { motion } from "framer-motion";
import { Users, Star, MessageSquareText, Calendar, Sparkles } from "lucide-react";
import HeroFeaturesMarquee from "./Hero/HeroFeaturesMarquee";
import HeroTestimonial from "./Hero/HeroTestimonial";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Hero({ onBookNow }) {
  const title = "Driving School in Gulberg, Lahore";

  return (
    <section
      id="home"
      className="font-raleway relative overflow-hidden bg-white py-20 md:py-28 lg:py-32"
    >
      <div className="relative mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">

          {/* ── Left column: text + CTA ── */}
          <div>
          <div className="max-w-[720px]">

          {/* Location label */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#FF3131] to-[#FF6201]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Gulberg 2, Lahore
            </span>
          </motion.div>

          {/* Heading + description */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-950 md:text-5xl lg:text-6xl"
          >
            {title.split("").map((char, i) => (
              <span
                key={i}
                className={`inline-block transition-all duration-200 ease-out md:hover:font-black md:hover:text-[#FF6201]${/\d/.test(char) ? " font-dm-sans" : ""}`}
              >
                {char === " " ? " " : char}
              </span>
            ))}
          </motion.h1>

          {/* Supporting descriptions — SEO-targeted for Lahore + Gulberg */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
            className="mt-5 max-w-[540px] space-y-4"
          >
            <p className="text-[12px] font-bold leading-[0.88] text-gray-700 md:text-[14px]">
              Learn one-to-one with Madam Razia, a female driving instructor.
            </p>
            <p className="text-[12px] leading-[0.88] text-gray-500 md:text-[14px]">
              Practise on roads around your area with convenient pick-up within
              20&nbsp;km. We can drop you home after your lesson, or arrange home
              pick-up with drop-off at your office to help fit driving lessons into a
              busy routine.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={onBookNow}
              className="
                btn-interactive
                inline-flex
                h-12
                items-center
                justify-center
                rounded-md
                bg-gray-900
                px-7
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-gray-900/10
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-gray-800
                hover:shadow-lg
              "
            >
              View Slots
            </button>
            <a
              href="/chat/"
              className="
                btn-interactive
                inline-flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-md
                border-2
                border-[#FF6201]
                bg-transparent
                px-7
                text-sm
                font-semibold
                text-[#FF6201]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[#FF6201]
                hover:text-white
              "
            >
              <Sparkles size={16} />
              Chat With AI
            </a>
          </motion.div>

          {/* Supporting benefit labels — restrained, no clutter */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2"
            aria-label="Key benefits"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              20 km pick-up
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              Local-road practice
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              Female instructor
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              Home-to-office option
            </span>
          </motion.div>

          {/* Social proof — lucide icons + mini text, company-logo feel */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600"><span className="font-dm-sans">5,221+</span></span> students
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600"><span className="font-dm-sans">5.0</span></span> rating
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <MessageSquareText size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600"><span className="font-dm-sans">136</span></span> reviews
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600">Est. <span className="font-dm-sans">2016</span></span>
            </span>
          </motion.div>

          <HeroFeaturesMarquee />
          </div>
          </div>

          {/* ── Right column: 3D flipping testimonial ── */}
          <div className="mt-2 flex justify-start lg:mt-16 lg:justify-end">
            <HeroTestimonial />
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
