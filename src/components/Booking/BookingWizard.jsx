import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

import BookingProgress from "./BookingProgress";
import BookingStep1 from "./BookingStep1";
import BookingStep2 from "./BookingStep2";
import BookingStep3 from "./BookingStep3";
import {
  calculatePickDropCharges,
  getCourseDurationDays,
  getCourseFee,
} from "../../lib/pickDropCalculator";

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
    email: "",
    area: "",

    course: "",
    pickup: "",
    address: "",
    distance: "",
    time: "",
    notes: "",
    preferred_date: "",

    customDays: "",
    customMinutes: "",
    customPrice: "",
  });

  const courseDuration = getCourseDurationDays(formData.course, {
    customDays: formData.customDays,
  });

  const courseFee = getCourseFee(formData.course, {
    customPrice: formData.customPrice,
  });

  const pricing = useMemo(() => {
    const { pickDropCharges, freeDistanceKm, chargeableDistanceKm, ratePerKm } =
      calculatePickDropCharges({
        distanceKm: formData.distance,
      });

    return {
      courseDuration,
      courseFee,
      pickDropCharges,
      freeDistanceKm,
      chargeableDistanceKm,
      ratePerKm,
      totalPayable: courseFee + pickDropCharges,
    };
  }, [courseDuration, courseFee, formData.distance]);

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
      email: "",
      area: "",

      course: bookingData?.course || "",

      pickup: "",
      address: "",
      distance: "",
      time: "",
      notes: "",
      preferred_date: "",

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
        bg-black/80
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
          max-w-[440px]
          max-h-[680px]
          overflow-y-auto
          rounded-2xl
          border
          border-white/25
          bg-white/10
          shadow-2xl
          backdrop-blur-2xl
          saturate-[1.2]
        "
      >
        <BookingProgress step={step} onClose={onClose} />

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
                pricing={pricing}
                next={() => setStep(3)}
                back={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <BookingStep3
                formData={formData}
                setFormData={setFormData}
                pricing={pricing}
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
