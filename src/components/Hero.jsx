import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Star, MessageSquareText, Calendar, Sparkles, User } from "lucide-react";
import { useRouter } from "../router";
import HeroFeaturesMarquee from "./Hero/HeroFeaturesMarquee";
import HeroTestimonial from "./Hero/HeroTestimonial";
import CustomerSignup from "./CustomerSignup";
import { getSession, onAuthStateChange } from "../lib/auth";
import googleLogo from "../assets/google-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Hero({ onBookNow }) {
  const { navigate } = useRouter();
  const title = "Driving School in Gulberg, Lahore";

  /* ── Auth state (mirrors Navbar: real Supabase session) ── */
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    });
    const unsubscribe = onAuthStateChange((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const isAuthenticated = authReady && user != null;

  return (
    <>
    <section
      id="home"
      className="rdc-section relative overflow-hidden"
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
            <span className="rdc-mono">
              Gulberg 2, Lahore
            </span>
          </motion.div>

          {/* Heading + description */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="mt-4 rdc-display"
            style={{ fontSize: "clamp(48px, 6vw, 88px)", lineHeight: 0.92 }}
          >
            {title.split(" ").map((word, wi) => (
              <span key={wi} className="inline-block">
                {word.split("").map((char, ci) => (
                  <span
                    key={ci}
                    className={`inline-block transition-all duration-200 ease-out md:hover:font-black md:hover:text-[#FF6201]${/\d/.test(char) ? " font-dm-sans" : ""}`}
                  >
                    {char}
                  </span>
                ))}
                {wi < title.split(" ").length - 1 ? " " : ""}
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
            <p className="text-[12px] font-bold leading-[1.6] text-gray-700 md:text-[14px]">
              Learn one-to-one with Madam Razia, a female driving instructor.
            </p>
            <p className="text-[12px] leading-[1.6] text-gray-500 md:text-[14px]">
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
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard/")}
                className="flex h-12 items-center justify-center gap-1.5 rounded-md bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-700 lg:hidden"
                aria-label="Go to your dashboard"
              >
                <User size={16} />
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => setSignupOpen(true)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 lg:hidden"
                aria-label="Sign in"
              >
                <img src={googleLogo} alt="" width="16" height="16" className="h-4 w-4" />
                Sign in
              </button>
            )}
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
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 rdc-hero-tags"
            aria-label="Key benefits"
          >
            <span className="flex items-center gap-1.5 rdc-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              20 km pick-up
            </span>
            <span className="flex items-center gap-1.5 rdc-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              Local-road practice
            </span>
            <span className="flex items-center gap-1.5 rdc-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
              Female instructor
            </span>
            <span className="flex items-center gap-1.5 rdc-mono">
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

      {/* ── Sign-in modal (mobile hero button only) ── */}
      <CustomerSignup
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
      />
    </>
  );
}

export default Hero;
