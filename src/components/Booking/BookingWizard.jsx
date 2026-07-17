import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

import BookingProgress from "./BookingProgress";
import BookingStep1 from "./BookingStep1";
import BookingStep2 from "./BookingStep2";
import BookingStep3 from "./BookingStep3";
import BookingLiveSummary from "./BookingLiveSummary";

function BookingWizard({
  isOpen,
  onClose,
  bookingData,
}) {
  const [step, setStep] = useState(1);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "",

    course: "",
    pickup: "",
    time: "",
    notes: "",

    customDays: "",
    customMinutes: "",
    customPrice: "",
  });

  // ESC Close

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () =>
      window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Reset Wizard

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);

    setFormData({
      name: "",
      phone: "",
      area: "",

      course: bookingData?.course || "",

      pickup: "",
      time: "",
      notes: "",

      customDays: bookingData?.days || "",
      customMinutes: bookingData?.minutes || "",
      customPrice: bookingData?.price || "",
    });
  }, [isOpen, bookingData]);

  // Keyboard Detection

  useEffect(() => {
    const handleFocus = (e) => {
      const tag = e.target.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        setKeyboardOpen(true);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        setKeyboardOpen(false);
      }, 150);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/60
        backdrop-blur-sm
        p-3
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        animate={{
          y: keyboardOpen ? -120 : 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          w-full
          max-w-md
          max-h-[82vh]
          overflow-y-auto
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >
        <BookingProgress step={step} />

        {/* Header */}

        <div className="flex items-start justify-between px-5 pt-5">

          <div>

            <h2 className="text-2xl font-black">
              Book Course
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete the booking in 3 easy steps.
            </p>

          </div>

          <button
            onClick={onClose}
            className="
              rounded-xl
              p-2
              transition
              hover:bg-gray-100
            "
          >
            <X size={22} />
          </button>

        </div>

        {/* LIVE SUMMARY */}

        <div className="px-5 pt-4">
          <BookingLiveSummary
            formData={formData}
          />
        </div>

        <AnimatePresence mode="wait">

          <motion.div
            key={step}
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -30,
            }}
            transition={{
              duration: 0.3,
            }}
          >

            {step === 1 && (
              <BookingStep1
                formData={formData}
                setFormData={setFormData}
                next={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <BookingStep2
                formData={formData}
                setFormData={setFormData}
                next={() => setStep(3)}
                back={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <BookingStep3
                formData={formData}
                setFormData={setFormData}
                back={() => setStep(2)}
                onClose={onClose}
              />
            )}

          </motion.div>

        </AnimatePresence>

      </motion.div>

    </div>
  );
}

export default BookingWizard;