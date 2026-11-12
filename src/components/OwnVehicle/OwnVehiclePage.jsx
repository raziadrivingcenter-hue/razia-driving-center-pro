import { useRef, useState } from "react";
import { ArrowLeft, CarFront } from "lucide-react";

import { useRouter } from "../../router";
import { useMeta } from "../../useMeta";
import { useOwnVehicleBooking } from "../../hooks/useOwnVehicleBooking";
import CourseCalculator from "./CourseCalculator";
import SlotPicker from "./SlotPicker";
import BookingDetails from "./BookingDetails";
import "./own-vehicle.css";

// Standalone page — no Navbar, no Footer. Only a "Go Back" control at the top.
export default function OwnVehiclePage() {
  const { navigate } = useRouter();
  const booking = useOwnVehicleBooking();
  const slotsRef = useRef(null);
  const bookingDetailsRef = useRef(null);

  // Card 2 (slot picker) owns this choice; Card 3 reads the same object so the
  // booking form and the charges always match the selected slot.
  const [slotSelection, setSlotSelection] = useState({ date: "", slot: "" });

  useMeta({
    title: "Learn On Your Own Vehicle | Razia Driving Center",
    description:
      "Build a driving course around your own vehicle. Choose your course length and daily lesson time, add pick & drop, and see your price live.",
    canonical: "https://raziadrivingcenter.com/learn-on-your-own-vehicle/",
  });

  const goBack = () => {
    // Prefer a real history entry so the visitor returns to where they came
    // from; fall back to the homepage when this page is the first entry.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  const scrollToSlots = () => {
    slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToBookingDetails = () => {
    bookingDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-[#FF6201] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <header className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6201]">
              <CarFront size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
                Learn On Your Own Vehicle
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Choose your own course length and lesson time. Pay only for what
                you need.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          <CourseCalculator booking={booking} onContinue={scrollToSlots} />

          <div ref={slotsRef} className="scroll-mt-6">
            <SlotPicker
              booking={booking}
              onContinue={scrollToBookingDetails}
              selection={slotSelection}
              onChange={setSlotSelection}
            />
          </div>

          <div ref={bookingDetailsRef} className="scroll-mt-6">
            <BookingDetails booking={booking} slotSelection={slotSelection} />
          </div>
        </div>
      </div>
    </div>
  );
}
