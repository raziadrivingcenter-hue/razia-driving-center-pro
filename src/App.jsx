import { useState, useEffect } from "react";
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
import Gallery from "./components/Gallery";
import About from "./components/About";
import FAQ from "./components/FAQ";
import MapSection from "./components/MapSection";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import LiveEnrollment from "./components/LiveEnrollment";
import WhatsAppButton from "./components/WhatsAppButton";

function App() {
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);

const [bookingData, setBookingData] = useState(null);
const openBooking = (data = null) => {
  setBookingData(data);
  setBookingOpen(true);
};

  // Premium Loading Logic
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
      const timer = setTimeout(finishLoading, 1200);
      return () => clearTimeout(timer);
    }

    window.addEventListener("load", finishLoading);

    return () => {
      window.removeEventListener("load", finishLoading);
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

        <Gallery />

        <About />

        <FAQ />

        <MapSection />

        <Contact />

        <Footer />

        <LiveEnrollment />

        <WhatsAppButton />
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