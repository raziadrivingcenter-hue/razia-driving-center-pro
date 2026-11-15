import { useEffect, lazy, Suspense } from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import "../App.css";

import { useRouter } from "../router";

import ScrollProgress from "./ScrollProgress";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Courses from "./Courses";
import WhyChoose from "./WhyChoose";
import ReviewsPlaceholder from "./GoogleReviews/ReviewsPlaceholder";
import Instructor from "./Instructor/Instructor";
import About from "./About";
import WhyBestSchool from "./WhyBestSchool";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import { DEFAULT_COURSE_TITLE } from "../data/courses";

// ── GoogleReviews: code-split, but never late ───────────────────────────────
// The section sits far below the fold, so its JS is not in the initial bundle.
// Two triggers make sure it is ready before anybody needs it:
//   1. on idle — requestIdleCallback, capped at 2s
//   2. the moment a #reviews anchor is clicked
const GoogleReviews = lazy(() => import("./GoogleReviews/GoogleReviews"));

let reviewsChunk = null;
function loadGoogleReviews() {
  if (!reviewsChunk) {
    reviewsChunk = import("./GoogleReviews/GoogleReviews");
  }
  return reviewsChunk;
}

// The placeholder has no id (so #reviews is never duplicated in the DOM), which
// means a bare anchor jump cannot find the section before the chunk lands.
// Scroll to it once the real section has mounted, and give up after 5s.
function scrollToReviewsWhenReady(attempt = 0) {
  const section = document.getElementById("reviews");

  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (attempt < 50) {
    setTimeout(() => scrollToReviewsWhenReady(attempt + 1), 100);
  }
}

// Phase 1C: Lazy-load below-fold components to reduce initial JS payload
const Gallery = lazy(() => import("./Gallery"));
const FAQ = lazy(() => import("./FAQ"));
const MapSection = lazy(() => import("./MapSection"));
const ServiceAreaMap = lazy(() => import("./ServiceAreaMap/ServiceAreaMap"));
const Contact = lazy(() => import("./Contact"));
const AIChatWidget = lazy(() => import("./AIChatWidget"));

function Homepage() {
  const { navigate } = useRouter();

  // Navigate to the slot-availability page, optionally carrying course data.
  const goToSlotBooking = (data = null) => {
    if (data?.course) {
      const p = new URLSearchParams();
      p.set("course", data.course);
      if (data.days) p.set("days", data.days);
      if (data.minutes) p.set("minutes", data.minutes);
      if (data.price) p.set("price", data.price);
      navigate(`/slot-availability/?${p.toString()}`);
    } else {
      navigate("/slot-availability/");
    }
  };

  // Read ?book= query param and redirect to the slot page with that course.
  const handleBookParam = () => {
    const params = new URLSearchParams(window.location.search);
    const book = params.get("book");
    if (!book) return;

    const courseMap = {
      basic: "Basic Plan",
      plus: "Economy Driving Course",
      pro: "Pro Driver Course",
    };

    if (courseMap[book]) {
      goToSlotBooking({ course: courseMap[book] });
    } else if (book === "custom") {
      const days = params.get("days") || "";
      const minutes = params.get("minutes") || "";
      const price = params.get("price") || "";
      goToSlotBooking({ course: "Custom Course", days, minutes, price });
    }

    // Clean the URL without reloading.
    window.history.replaceState({}, "", window.location.pathname);
  };

  // Handle ?book= param on mount.
  useEffect(() => {
    handleBookParam();
  }, []);

  // AOS
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
    });
  }, []);

  // Fetch the reviews chunk on idle, so it is already cached by the time the
  // user scrolls down to it. requestIdleCallback is missing in Firefox and
  // Safari, so fall back to a plain 2s timer there.
  useEffect(() => {
    let cancelled = false;

    const start = () => {
      if (!cancelled) loadGoogleReviews();
    };

    const idle =
      typeof window !== "undefined" && window.requestIdleCallback
        ? window.requestIdleCallback(start, { timeout: 2000 })
        : setTimeout(start, 2000);

    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && window.cancelIdleCallback) {
        window.cancelIdleCallback(idle);
      } else {
        clearTimeout(idle);
      }
    };
  }, []);

  // Clicking the navbar "Reviews" anchor starts the chunk immediately and
  // scrolls to the section once it has actually mounted.
  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest?.('a[href="#reviews"]');
      if (!link) return;

      loadGoogleReviews().then(() => scrollToReviewsWhenReady());
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Skip link — first focusable element on the page. Hidden until
            focused; the visible style lives in index.css (.skip-to-content). */}
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>

        <ScrollProgress />

        <Navbar onBookNow={() => navigate("/slot-availability/")} />

        {/* tabindex="-1" lets the skip link move focus here, not just scroll */}
        <main id="main" tabIndex={-1}>
          <Hero
            onBookNow={() =>
              navigate(
                `/slot-availability/?course=${encodeURIComponent(
                  DEFAULT_COURSE_TITLE
                )}`
              )
            }
          />

          <Courses onCustomBooking={goToSlotBooking} />

          <WhyChoose />

          <Suspense fallback={<ReviewsPlaceholder />}>
            <GoogleReviews />
          </Suspense>

          <Instructor />

          <Suspense fallback={null}>
            <ServiceAreaMap />
          </Suspense>

          <Suspense fallback={null}>
            <Gallery />
          </Suspense>

          <About />

          <Suspense fallback={null}>
            <FAQ />
          </Suspense>

          <Suspense fallback={null}>
            <MapSection />
          </Suspense>

          <Suspense fallback={null}>
            <Contact />
          </Suspense>

          <WhyBestSchool />
        </main>

        <Footer />

        <WhatsAppButton />

        <Suspense fallback={null}>
          <AIChatWidget />
        </Suspense>
      </div>
    </>
  );
}

export default Homepage;
