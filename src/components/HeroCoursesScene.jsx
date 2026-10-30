import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

import SectionTitle from "./UI/SectionTitle";
import CourseCard from "./CourseCard";
import { courses } from "../data/courses";
import { HeroLeftColumn, HeroRightColumn } from "./Hero";
import { CoursesRest } from "./Courses";
import { useDesktopMotion } from "../hooks/useDesktopMotion";

/* ------------------------------------------------------------------ */
/*  Static fallback — mobile, short viewports, or reduced motion.
    Renders the plain Hero + Courses (with its band background). Only
    one of <StaticLayout> / <PinnedScene> is ever in the DOM.
   ------------------------------------------------------------------ */
function StaticLayout({ onBookNow, onCustomBooking }) {
  return (
    <>
      <section id="home" className="rdc-section relative overflow-x-clip">
        <div className="relative mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
            <div>
              <div className="max-w-[720px]">
                <HeroLeftColumn onBookNow={onBookNow} />
              </div>
            </div>
            <div className="mt-2 flex justify-start lg:mt-16 lg:justify-end">
              <HeroRightColumn />
            </div>
          </div>
        </div>
      </section>

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
          <CoursesRest onCustomBooking={onCustomBooking} />
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  One animated course card in the pinned scene. Own hooks are always
/*  called in the same order because each card is its own component.
   ------------------------------------------------------------------ */
const CARD_STARTS = [0.4, 0.57, 0.74];

function SceneCourseCard({ progress, course, onBook, index }) {
  const start = CARD_STARTS[index];
  const end = start + 0.17;
  const x = useTransform(progress, [start, end], ["110vw", "0vw"]);
  const rotateY = useTransform(progress, [start, end], [35, 0]);
  const scale = useTransform(progress, [start, end], [0.94, 1]);
  const opacity = useTransform(progress, [start, end], [0, 1]);

  return (
    <motion.div
      style={{
        x,
        rotateY,
        scale,
        opacity,
        transformOrigin: "right center",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      }}
    >
      <CourseCard
        {...course}
        popular={course.name === "Economy Driving Course"}
        onBook={onBook}
        compact
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pinned scroll scene (desktop only). All hooks are always called;
    this component is only mounted when the scene is enabled.
   ------------------------------------------------------------------ */
function PinnedScene({ onBookNow, onCustomBooking }) {
  const sceneRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.6 });

  // A: hero left column — slide left + fade out.
  const leftX = useTransform(p, [0.05, 0.35], ["0vw", "-110vw"]);
  const leftOpacity = useTransform(p, [0.22, 0.35], [1, 0]);

  // B: review card — rise up + fade out.
  const cardY = useTransform(p, [0.05, 0.3], [0, -220]);
  const cardOpacity = useTransform(p, [0.15, 0.3], [1, 0]);

  // C: courses heading — slide in from right.
  const headingX = useTransform(p, [0.3, 0.42], ["60vw", "0vw"]);
  const headingOpacity = useTransform(p, [0.3, 0.42], [0, 1]);

  // Pointer-events toggling so hidden elements aren't clickable.
  const [heroInteractive, setHeroInteractive] = useState(true);
  useMotionValueEvent(p, "change", (v) => setHeroInteractive(v <= 0.35));

  const [coursesInteractive, setCoursesInteractive] = useState(false);
  useMotionValueEvent(p, "change", (v) => setCoursesInteractive(v >= 0.38));

  return (
    <>
      {/* The tall scroll-driving section. id="home" keeps the navbar
          "Home" link working. A zero-height sentinel carries id="courses"
          at the scroll position where p ≈ 0.95 so the navbar "Courses"
          link lands with the cards fully settled. */}
      <section
        id="home"
        ref={sceneRef}
        style={{ height: "450vh", position: "relative" }}
      >
        {/* sentinel: scrollIntoView target for #courses → p ≈ 0.95.
            450vh scene, pin spans [0, 350vh] of scroll; p=0.95 ↔ scrollOffset
            332.5vh ↔ top 73.9% of the scene. */}
        <div
          id="courses"
          style={{
            position: "absolute",
            left: 0,
            top: "73.9%",
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "clip",
          }}
        >
          {/* ── Hero layer (A + B) ── */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: heroInteractive ? "auto" : "none",
              willChange: "transform, opacity",
            }}
          >
            <div className="rdc-section relative h-full">
              <div className="relative mx-auto flex h-full max-w-6xl items-center px-6 md:px-8">
                <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
                  {/* A: left column */}
                  <motion.div
                    style={{
                      x: leftX,
                      opacity: leftOpacity,
                      willChange: "transform, opacity",
                    }}
                  >
                    <div className="max-w-[720px]">
                      <HeroLeftColumn onBookNow={onBookNow} compact />
                    </div>
                  </motion.div>

                  {/* B: review card */}
                  <motion.div
                    className="mt-2 flex justify-start lg:mt-16 lg:justify-end"
                    style={{
                      y: cardY,
                      opacity: cardOpacity,
                      willChange: "transform, opacity",
                    }}
                  >
                    <HeroRightColumn />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Courses layer (C + D) ── */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: coursesInteractive ? "auto" : "none",
              willChange: "transform, opacity",
            }}
          >
            <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
              {/* C: section heading */}
              <motion.div
                style={{
                  x: headingX,
                  opacity: headingOpacity,
                  willChange: "transform, opacity",
                }}
              >
                <SectionTitle
                  badge="Professional Courses"
                  title="Choose Your Driving Course"
                  subtitle="One-to-one driving lessons designed to help you become a safe and confident driver on Lahore's roads."
                />
              </motion.div>

              {/* D: 3 course cards with 3D tilt */}
              <div
                className="mt-6 grid gap-5 md:grid-cols-3 md:gap-6"
                style={{ perspective: "1400px" }}
              >
                {courses.map((course, i) => (
                  <SceneCourseCard
                    key={course.name}
                    progress={p}
                    course={course}
                    onBook={onCustomBooking}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* E: rest of Courses — pick & drop, custom, promos — normal flow.
          Wrapped in the courses band (bg + padding) so it keeps its
          background and the 1px rule from the following section. */}
      <section className="bg-gray-50 py-12 md:py-16">
        <CoursesRest onCustomBooking={onCustomBooking} />
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Top-level gate: decides which layout to render.
   ------------------------------------------------------------------ */
export default function HeroCoursesScene({ onBookNow, onCustomBooking }) {
  const desktop = useDesktopMotion();

  // Also require a tall enough viewport so the 100vh stage has room for
  // heading + 3 compact cards.
  const [tallEnough, setTallEnough] = useState(
    typeof window === "undefined" ? false : window.innerHeight >= 700
  );
  useEffect(() => {
    const check = () => setTallEnough(window.innerHeight >= 700);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (desktop && tallEnough) {
    return (
      <PinnedScene
        onBookNow={onBookNow}
        onCustomBooking={onCustomBooking}
      />
    );
  }

  return (
    <StaticLayout
      onBookNow={onBookNow}
      onCustomBooking={onCustomBooking}
    />
  );
}
