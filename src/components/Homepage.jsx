import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";

import AOS from "aos";
import "aos/dist/aos.css";

import "../App.css";
import "../styles/home-reference.css";

import LoadingScreen from "./Loading/LoadingScreen";
import { useRouter } from "../router";

import ScrollProgress from "./ScrollProgress";
import Navbar from "./Navbar";
import HeroCoursesScene from "./HeroCoursesScene";
import WhyChoose from "./WhyChoose";
import GoogleReviews from "./GoogleReviews/GoogleReviews";
import Instructor from "./Instructor/Instructor";
import About from "./About";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

// Phase 1C: Lazy-load below-fold components to reduce initial JS payload
const Gallery = lazy(() => import("./Gallery"));
const FAQ = lazy(() => import("./FAQ"));
const MapSection = lazy(() => import("./MapSection"));
const ServiceAreaMap = lazy(() => import("./ServiceAreaMap/ServiceAreaMap"));
const Contact = lazy(() => import("./Contact"));
const AIChatWidget = lazy(() => import("./AIChatWidget"));

function Homepage() {
  const [loading, setLoading] = useState(true);
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

  // Premium Loading Logic — Phase 1C: finish as soon as DOM is ready,
  // do not wait for all images/resources (that blocks LCP).
  useEffect(() => {
    function finishLoading() {
      setLoading(false);

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));

        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("scroll"));
        });
      });
    }

    if (document.readyState === "complete") {
      const timer = setTimeout(finishLoading, 400);
      return () => clearTimeout(timer);
    }

    document.addEventListener("DOMContentLoaded", finishLoading);

    const fallback = setTimeout(finishLoading, 1500);

    return () => {
      document.removeEventListener("DOMContentLoaded", finishLoading);
      clearTimeout(fallback);
    };
  }, []);

  // Handle ?book= param after loading completes.
  useEffect(() => {
    if (!loading) {
      handleBookParam();
    }
  }, [loading]);

  // AOS
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
    });
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <div className="rdc-home min-h-screen">
        <ScrollProgress />

        <Navbar onBookNow={() => navigate("/slot-availability/")} />

        <HeroCoursesScene
          onBookNow={() => navigate("/slot-availability/")}
          onCustomBooking={goToSlotBooking}
        />

        <WhyChoose />

        <GoogleReviews />

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
