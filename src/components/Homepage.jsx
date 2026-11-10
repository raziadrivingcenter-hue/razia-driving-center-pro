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
import GoogleReviews from "./GoogleReviews/GoogleReviews";
import Instructor from "./Instructor/Instructor";
import About from "./About";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import { DEFAULT_COURSE_TITLE } from "../data/courses";

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

  return (
    <>
      <div className="min-h-screen bg-white">
        <ScrollProgress />

        <Navbar onBookNow={() => navigate("/slot-availability/")} />

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
