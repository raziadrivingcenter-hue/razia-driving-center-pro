// =============================================================================
//  Home page — "Why a Best Driving School in Lahore Matters"
// =============================================================================
//  Plain and always visible: no AOS, no framer-motion, no accordion/tabs and
//  no lazy loading. Every word is in the DOM on first paint, so visitors with
//  JavaScript disabled and crawlers see the same content as everyone else.
//
//  The section sits on a light photographic background (bgimage5.png) with a
//  soft white veil so the dark text keeps its contrast. The eight skill cards
//  are LiquidGlass surfaces — the glass bends the background photo through a
//  Snell's-law displacement map, with a frosted fallback elsewhere.
// =============================================================================

import bgImage768 from "../assets/bgimage5-768.webp";
import bgImage1440 from "../assets/bgimage5-1440.webp";
import { LiquidGlass } from "./UI/liquid-glass";

const SKILLS = [
  {
    title: "Road Sense",
    text: "Read traffic, judge gaps and speed, and anticipate what other drivers will do.",
  },
  {
    title: "Rules and Regulations",
    text: "Traffic laws, road signs and road markings explained in plain language.",
  },
  {
    title: "Road Awareness",
    text: "Mirrors, blind spots, pedestrians, bikes and rickshaws: seeing the whole road around you.",
  },
  {
    title: "Best Practices",
    text: "Safe habits from seat and mirror setup to smooth clutch, braking and lane discipline.",
  },
  {
    title: "Parking Skills",
    text: "Reverse, angle and bay parking until you can park confidently in tight spaces.",
  },
  {
    title: "Parallel Parking",
    text: "A clear step-by-step method, practised until it feels natural.",
  },
  {
    title: "Roundabouts",
    text: "How to enter, choose your lane and exit safely at busy Lahore roundabouts.",
  },
  {
    title: "Heavy Traffic Practice",
    text: "Calm, controlled driving on main roads and in real traffic.",
  },
];

function WhyBestSchool() {
  return (
    <section
      id="why-best-driving-school"
      aria-labelledby="why-best-heading"
      className="font-raleway relative overflow-hidden border-t border-[#E8E8E8] bg-white py-12 md:py-16"
    >
      {/* Background photo — decorative, hidden from assistive tech. Anchored to
          the bottom so the car and skyline stay in frame on wide sections. */}
      <img
        src={bgImage768}
        srcSet={`${bgImage768} 768w, ${bgImage1440} 1440w`}
        sizes="100vw"
        width={1440}
        height={810}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom"
      />

      {/* Soft white veil: keeps the dark text readable over the photo and
          calms the backdrop behind the glass cards. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white/85"
      />

      <div className="relative mx-auto max-w-6xl px-6">

        <h2
          id="why-best-heading"
          className="max-w-[640px] text-2xl font-extrabold leading-[1.2] text-[#1A1A1A] md:text-3xl"
        >
          Why a Best Driving School in Lahore Matters
        </h2>

        <p className="mt-3 max-w-[640px] text-sm leading-[1.6] text-[#666]">
          Lahore's roads are busy, fast and unpredictable. The right driving
          school is the difference between a driver who only passes a test and
          one who stays calm and safe in real traffic. At Razia Driving Center
          we teach one-to-one, from your very first time behind the wheel to
          advanced driving, so you build real skill and confidence, not just
          enough to pass.
        </p>

        <h3 className="mt-8 text-lg font-extrabold text-[#1A1A1A] md:text-xl">
          What We Teach, From Scratch to Advanced
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SKILLS.map((skill) => (
            <LiquidGlass
              key={skill.title}
              radius={16}
              bevelDepth={8}
              scale={24}
              aberration={2}
              frost={2}
              tint={0.4}
              className="p-3 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="mb-1.5 block h-0.5 w-6 rounded-full bg-[#FF6201]"
              />
              <h3 className="text-sm font-bold leading-tight text-[#1A1A1A]">
                {skill.title}
              </h3>
              <p className="mt-1 text-xs leading-snug text-[#666]">
                {skill.text}
              </p>
            </LiquidGlass>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-extrabold text-[#1A1A1A] md:text-xl">
          Every Minute You Committed To
        </h3>

        <p className="mt-3 max-w-[640px] text-sm leading-[1.6] text-[#666]">
          Lessons are practical, one-to-one and on real roads. You receive the
          full time you committed to when you enrolled: if you enrol for 10
          days, you get 10 days of practical driving.
        </p>

        <p className="mt-4 max-w-[640px] text-sm leading-[1.6] text-[#666]">
          Explore our{" "}
          <a
            href="/driving-courses-lahore/"
            className="font-semibold text-[#FF6201] hover:underline"
          >
            driving courses and fees
          </a>
          , learn about our{" "}
          <a
            href="/female-driving-instructor-lahore/"
            className="font-semibold text-[#FF6201] hover:underline"
          >
            female driving instructor
          </a>
          , see our{" "}
          <a
            href="/practical-driving-lessons-lahore/"
            className="font-semibold text-[#FF6201] hover:underline"
          >
            practical driving lessons
          </a>{" "}
          and{" "}
          <a
            href="/advanced-driving-lahore/"
            className="font-semibold text-[#FF6201] hover:underline"
          >
            advanced driving lessons
          </a>
          , or{" "}
          <a
            href="/slot-availability/"
            className="font-semibold text-[#FF6201] hover:underline"
          >
            book your slot online
          </a>
          .
        </p>

      </div>
    </section>
  );
}

export default WhyBestSchool;
