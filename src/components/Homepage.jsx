import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";

import AOS from "aos";
import "aos/dist/aos.css";

import "../App.css";

import LoadingScreen from "./Loading/LoadingScreen";
import BookingWizard from "./Booking/BookingWizard";

import ScrollProgress from "./ScrollProgress";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Stats from "./Stats";
import Courses from "./Courses";
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
const Contact = lazy(() => import("./Contact"));
const AIChatWidget = lazy(() => import("./AIChatWidget"));

function Homepage() {
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const openBooking = (data = null) => {
    setBookingData(data);
    setBookingOpen(true);
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

      <div className="min-h-screen bg-white">
        <ScrollProgress />

        <Navbar onBookNow={() => openBooking()} />

        <Hero onBookNow={() => openBooking()} />

        <Stats />

        <Courses onCustomBooking={openBooking} />

        <WhyChoose />

        <GoogleReviews />

        <Instructor />

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

      <BookingWizard
        isOpen={bookingOpen}
        bookingData={bookingData}
        onClose={() => {
          setBookingOpen(false);
          setBookingData(null);
        }}
      />
    </>
  );
}

export default Homepage;
