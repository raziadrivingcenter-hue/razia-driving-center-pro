import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";

import AOS from "aos";
import "aos/dist/aos.css";

import "./App.css";

import LoadingScreen from "./components/Loading/LoadingScreen";
import BookingWizard from "./components/Booking/BookingWizard";

import ScrollProgress from "./components/ScrollProgress";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Courses from "./components/Courses";
import WhyChoose from "./components/WhyChoose";
import GoogleReviews from "./components/GoogleReviews/GoogleReviews";
import Instructor from "./components/Instructor/Instructor";
import About from "./components/About";
import Footer from "./components/Footer";
import LiveEnrollment from "./components/LiveEnrollment";
import WhatsAppButton from "./components/WhatsAppButton";

// Phase 1C: Lazy-load below-fold components to reduce initial JS payload
const Gallery = lazy(() => import("./components/Gallery"));
const FAQ = lazy(() => import("./components/FAQ"));
const MapSection = lazy(() => import("./components/MapSection"));
const Contact = lazy(() => import("./components/Contact"));
const AIChatWidget = lazy(() =>
  import("./components/AIChatWidget")
);

function App() {
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

    // If document already fully loaded, finish after a brief splash
    if (document.readyState === "complete") {
      const timer = setTimeout(finishLoading, 400);
      return () => clearTimeout(timer);
    }

    // Otherwise finish on DOMContentLoaded (DOM parsed, images may still load)
    document.addEventListener("DOMContentLoaded", finishLoading);

    // Safety fallback — never block more than 1.5s even if DOMContentLoaded
    // somehow doesn't fire
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

        <Courses
            onCustomBooking={openBooking}
           />

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

        <LiveEnrollment />

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

export default App;