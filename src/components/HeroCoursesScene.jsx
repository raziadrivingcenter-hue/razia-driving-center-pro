import { Component, useRef, useState, useEffect, useLayoutEffect } from "react";
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
import heroBg from "../assets/BG.webp";
import heroBgSmall from "../assets/BG-1280.webp";

/* ------------------------------------------------------------------ */
/*  Static fallback — mobile, short viewports, or reduced motion.
    Renders the plain Hero + Courses (with its band background). Only
    one of <StaticLayout> / <PinnedScene> is ever in the DOM.
   ------------------------------------------------------------------ */
function StaticLayout({ onBookNow, onCustomBooking }) {
  return (
    <>
      <section id="home" className="rdc-section relative overflow-x-clip">
        <img
          src={heroBgSmall}
          width={1280}
          height={720}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          loading="eager"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div
          className="rdc-hero-scrim"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
        />
        <div className="relative z-[2] mx-auto max-w-6xl px-6 md:px-8">
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
/*  Per-card enter/exit timing on the scroll progress (p).
    Card 0: enters [0.18,0.32], exits [0.50,0.62]
    Card 1: enters [0.50,0.64], exits [0.76,0.88]
    Card 2: enters [0.76,0.90], stays to p = 1
   ------------------------------------------------------------------ */
const CARD_RANGES = [
  { enter: [0.18, 0.32], exit: [0.50, 0.62] },
  { enter: [0.50, 0.64], exit: [0.76, 0.88] },
  { enter: [0.76, 0.90], exit: null },
];

/* ------------------------------------------------------------------ */
/*  One glass course card in the shared slot. The glass morphism lives
    on THIS element (the one carrying the transform) because transformed
    ancestors disable backdrop-filter. No ancestor of this element has
    opacity < 1, filter, will-change, or transform.
   ------------------------------------------------------------------ */
function SceneGlassCard({ progress, course, onBook, index }) {
  const { enter, exit } = CARD_RANGES[index];

  // Build keyframe arrays: settle below (70vh) → center (0) → rise (-70vh).
  let yInput, yOutput, rotInput, rotOutput, opInput, opOutput;
  if (exit) {
    const [exStart, exEnd] = exit;
    yInput = [0, enter[0], enter[1], exStart, exEnd, 1];
    yOutput = ["70vh", "70vh", "0vh", "0vh", "-70vh", "-70vh"];
    rotInput = [0, enter[0], enter[1], exStart, exEnd, 1];
    rotOutput = [18, 18, 0, 0, -18, -18];
    opInput = [0, enter[0], enter[1], exStart, exEnd, 1];
    opOutput = [0, 0, 1, 1, 0, 0];
  } else {
    yInput = [0, enter[0], enter[1], 1];
    yOutput = ["70vh", "70vh", "0vh", "0vh"];
    rotInput = [0, enter[0], enter[1], 1];
    rotOutput = [18, 18, 0, 0];
    opInput = [0, enter[0], enter[1], 1];
    opOutput = [0, 0, 1, 1];
  }

  const y = useTransform(progress, yInput, yOutput);
  const rotateX = useTransform(progress, rotInput, rotOutput);
  const opacity = useTransform(progress, opInput, opOutput);

  // Toggle interactivity at the 0.5 opacity threshold. Guard .get() with
  // optional chaining so a missing motion value defaults to 0 (non-interactive)
  // instead of crashing.
  const [interactive, setInteractive] = useState(
    (opacity?.get() ?? 0) >= 0.5
  );
  useMotionValueEvent(opacity, "change", (v) => setInteractive(v >= 0.5));

  return (
    <motion.div
      className="glass-card"
      style={{
        position: "absolute",
        inset: 0,
        y,
        rotateX,
        opacity,
        pointerEvents: interactive ? "auto" : "none",
        willChange: "transform, opacity",
        transformStyle: "preserve-3d",
      }}
      inert={!interactive}
    >
      <CourseCard
        {...course}
        popular={course.name === "Economy Driving Course"}
        onBook={onBook}
        compact
        glass
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
  const stageRef = useRef(null);
  const gridRef = useRef(null);
  const reviewCardRef = useRef(null);
  const measureRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.6,
  });

  // Measured layout values (set on mount + resize).
  const [leftColLeftEdge, setLeftColLeftEdge] = useState(0);
  const [reviewCardLeftEdge, setReviewCardLeftEdge] = useState(0);
  const [stageWidth, setStageWidth] = useState(0);
  const [slotHeight, setSlotHeight] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (
        !stageRef.current ||
        !gridRef.current ||
        !reviewCardRef.current
      )
        return;
      const stageRect = stageRef.current.getBoundingClientRect();
      // gridRef has no transforms → its left edge is the left column's
      // left edge regardless of scroll position (robust to resize-during-scroll).
      setLeftColLeftEdge(
        gridRef.current.getBoundingClientRect().left - stageRect.left
      );
      // reviewCardRef has only a y transform → left edge is stable.
      setReviewCardLeftEdge(
        reviewCardRef.current.getBoundingClientRect().left - stageRect.left
      );
      setStageWidth(stageRect.width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Card slot width: fit within the viewport, capped at ~440px.
  const cardWidth =
    stageWidth > 0 && reviewCardLeftEdge > 0
      ? Math.min(440, stageWidth - reviewCardLeftEdge - 16)
      : 440;

  // Measure the tallest card's natural height (before paint) so the slot
  // is exactly as tall as its content, capped at 72vh.
  useLayoutEffect(() => {
    if (measureRef.current) {
      let maxH = 0;
      for (const child of measureRef.current.children) {
        maxH = Math.max(maxH, child.scrollHeight);
      }
      if (maxH > 0) {
        setSlotHeight(Math.min(maxH, window.innerHeight * 0.72));
      }
    }
  }, [cardWidth]);

  // A: hero left column — slide left and STAY (no opacity change).
  const leftColSlide = -(leftColLeftEdge - 56);
  const leftX = useTransform(p, [0.05, 0.25], [0, leftColSlide]);

  // B: review card — rise up and fade out.
  const reviewY = useTransform(p, [0.1, 0.28], [0, "-100vh"]);
  const reviewOpacity = useTransform(p, [0.1, 0.28], [1, 0]);

  // Pointer-events toggling so the hero isn't clickable once cards arrive.
  const [heroInteractive, setHeroInteractive] = useState(true);
  useMotionValueEvent(p, "change", (v) => setHeroInteractive((v ?? 0) <= 0.35));

  return (
    <>
      {/* Edge-lensing filter (Chromium only). Applied to the glass card's
          backdrop via CSS @supports (backdrop-filter: url(#rdc-lens)).
          feTurbulence → feDisplacementMap bends the backdrop at the glass
          edges. Acts on the backdrop only — card text is not distorted. */}
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        style={{ position: "absolute" }}
      >
        <filter id="rdc-lens">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Hidden measurement: every card in natural flow so we can read the
          tallest card's content height. Off-screen, not painted. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
          width: cardWidth,
        }}
      >
        {courses.map((course) => (
          <CourseCard
            key={course.name}
            {...course}
            popular={course.name === "Economy Driving Course"}
            onBook={onCustomBooking}
            compact
            glass
          />
        ))}
      </div>

      {/* The tall scroll-driving section. id="home" keeps the navbar
          "Home" link working. A zero-height sentinel carries id="courses"
          at the scroll position where p = 1 so the navbar "Courses" link
          lands with card 3 held. */}
      <section
        id="home"
        ref={sceneRef}
        style={{ height: "500vh", position: "relative" }}
      >
        {/* Screen-reader only heading for the courses region. Present in
            the DOM for structure/SEO but visually hidden. */}
        <h2 className="rdc-sr-only">Choose Your Driving Course</h2>

        {/* sentinel: scrollIntoView target for #courses → p = 1.
            500vh scene, pin spans [0, 400vh] of scroll; p=1 ↔ scrollOffset
            400vh ↔ top 80% of the scene. */}
        <div
          id="courses"
          style={{
            position: "absolute",
            left: 0,
            top: "80%",
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />

        <div
          ref={stageRef}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "clip",
          }}
        >
          {/* Layer 0: hero photograph. A SIBLING of the card slot (never an
              ancestor), so it can never break the glass backdrop-filter.
              Decorative: alt="" + aria-hidden. */}
          <img
            src={heroBg}
            srcSet={`${heroBgSmall} 1280w, ${heroBg} 2560w`}
            sizes="100vw"
            width={2560}
            height={1440}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            loading="eager"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Layer 1: readability scrim over the photograph. Sibling of the
              card slot, below the content. Strength via --rdc-hero-scrim. */}
          <div
            className="rdc-hero-scrim"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Layer 2: hero (left column + review card). This is a SIBLING
              layer of the card slot, not an ancestor — so its transforms do
              not affect the glass cards' backdrop-filter. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: heroInteractive ? "auto" : "none",
            }}
          >
            <div className="rdc-section relative h-full">
              <div className="relative mx-auto flex h-full max-w-6xl items-center px-6 md:px-8">
                <div
                  ref={gridRef}
                  className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_340px] lg:gap-16"
                >
                  {/* A: left column — slides left and stays. */}
                  <motion.div
                    style={{
                      x: leftX,
                      willChange: "transform",
                    }}
                  >
                    <div className="max-w-[720px]">
                      <HeroLeftColumn onBookNow={onBookNow} compact />
                    </div>
                  </motion.div>

                  {/* B: review card — rises up and fades out. */}
                  <motion.div
                    ref={reviewCardRef}
                    className="mt-2 flex justify-start lg:mt-16 lg:justify-end"
                    style={{
                      y: reviewY,
                      opacity: reviewOpacity,
                      willChange: "transform, opacity",
                    }}
                  >
                    <HeroRightColumn />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3: card slot. CRUCIALLY, no opacity/filter/transform/will-
              change on this layer or any ancestor of the glass cards — those
              properties break backdrop-filter. pointer-events are handled
              per-card (the layer itself passes through). */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                marginLeft: reviewCardLeftEdge,
                width: cardWidth,
                height: slotHeight ?? "72vh",
                perspective: "1400px",
                position: "relative",
                pointerEvents: "none",
              }}
            >
              {courses.map((course, i) => (
                <SceneGlassCard
                  key={course.name}
                  progress={p}
                  course={course}
                  onBook={onCustomBooking}
                  index={i}
                />
              ))}
            </div>
          </div>
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
/*  Error boundary — if the pinned scene throws (e.g. a motion-value
    regression), fall back to the static layout so the page is never blank.
   ------------------------------------------------------------------ */
class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // Surface the error in the console for debugging but keep the page alive.
    console.error(
      "[HeroCoursesScene] pinned scene crashed — falling back to static layout:",
      error,
      info
    );
  }
  render() {
    if (this.state.hasError) {
      const { onBookNow, onCustomBooking } = this.props;
      return (
        <StaticLayout
          onBookNow={onBookNow}
          onCustomBooking={onCustomBooking}
        />
      );
    }
    return this.props.children;
  }
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
      <SceneErrorBoundary
        onBookNow={onBookNow}
        onCustomBooking={onCustomBooking}
      >
        <PinnedScene
          onBookNow={onBookNow}
          onCustomBooking={onCustomBooking}
        />
      </SceneErrorBoundary>
    );
  }

  return (
    <StaticLayout
      onBookNow={onBookNow}
      onCustomBooking={onCustomBooking}
    />
  );
}
