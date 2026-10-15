import { motion } from "framer-motion";
import { Users, Star, MessageSquareText, Calendar } from "lucide-react";
import Floating3DParticles from "./Hero/Floating3DParticles";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Hero({ onBookNow }) {
  const title = "Driving School in Gulberg 2, Lahore";

  return (
    <section
      id="home"
      className="font-raleway relative overflow-hidden bg-white py-20 md:py-28 lg:py-32"
    >
      {/* Premium 3D particle field — brand orange on white, subtle depth */}
      <Floating3DParticles
        quantity={180}
        color="#FF6201"
        size={3.5}
        opacity={0.14}
        drift={0.5}
        depth={0.45}
        className="z-0"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
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

          {/* H1 — per-letter hover on desktop */}
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
                className="inline-block transition-all duration-200 ease-out md:hover:font-black md:hover:text-[#FF6201]"
              >
                {char === " " ? " " : char}
              </span>
            ))}
          </motion.h1>

          {/* Supporting line */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
            className="mt-6 max-w-[540px] text-base leading-relaxed text-gray-500 md:text-lg"
          >
            One-to-one lessons with Madam Razia. Pick-up, training in your area,
            then drop home.
          </motion.p>

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
                rounded-full
                bg-gradient-to-r
                from-[#FF3131]
                to-[#FF6201]
                px-7
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-orange-500/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-lg
                hover:shadow-orange-500/30
              "
            >
              Book a Course
            </button>
            <a
              href="https://wa.me/923094461407"
              target="_blank"
              rel="noreferrer"
              className="
                btn-interactive
                inline-flex
                h-12
                items-center
                justify-center
                rounded-full
                bg-[#25D366]
                px-7
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-green-500/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-lg
                hover:shadow-green-500/30
              "
            >
              Chat on WhatsApp
            </a>
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
              <span className="font-semibold text-gray-600">5,221+</span> students
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600">5.0</span> rating
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <MessageSquareText size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600">136</span> reviews
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={14} strokeWidth={1.8} />
              <span className="font-semibold text-gray-600">Est. 2016</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
