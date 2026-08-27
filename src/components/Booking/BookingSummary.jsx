import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock3, CarFront } from "lucide-react";
import { useEffect, useState } from "react";

function BookingSummary({ formData }) {
  const [displayPrice, setDisplayPrice] = useState(0);

  const isCustom = formData.course === "Custom Course";

  const targetPrice = isCustom
    ? Number(formData.customPrice || 0)
    : Number(
        (
          formData.course === "Basic Plan"
            ? 9999
            : formData.course === "Economy Driving Course"
            ? 14500
            : formData.course === "Pro Driver Course"
            ? 21750
            : 0
        )
      );

  useEffect(() => {
    let start = 0;

    const duration = 700;

    const stepTime = 15;

    const increment = targetPrice / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;

      if (start >= targetPrice) {
        start = targetPrice;
        clearInterval(timer);
      }

      setDisplayPrice(Math.round(start));
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetPrice]);

  return (
    <AnimatePresence mode="wait">

      <motion.div
        key={`${formData.course}-${targetPrice}`}
        initial={{
          opacity: 0,
          y: -20,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          overflow-hidden
          rounded-xl
          border
          border-white/20
          bg-white/[0.07]
          shadow-lg
          backdrop-blur-md
        "
      >

        <div
          className="
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-4
            py-2
            text-white
          "
        >

          <div className="flex items-center justify-between">

            <h3 className="text-sm font-black">
              Booking Summary
            </h3>

            {isCustom && (
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                }}
                className="
                  rounded-full
                  bg-white
                  px-2.5
                  py-0.5
                  text-[10px]
                  font-bold
                  text-[#FF6201]
                "
              >
                CUSTOM
              </motion.div>
            )}

          </div>

        </div>

        <div className="space-y-2.5 p-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-gray-300">
              Course
            </span>

            <span className="text-sm font-bold text-gray-100">
              {formData.course}
            </span>

          </div>

          {isCustom && (

            <>
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <CalendarDays
                    size={14}
                    className="text-[#FF6201]"
                  />

                  <span className="text-xs text-gray-300">
                    Days
                  </span>

                </div>

                <span className="text-sm font-bold text-gray-100">
                  {formData.customDays}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Clock3
                    size={14}
                    className="text-[#FF6201]"
                  />

                  <span className="text-xs text-gray-300">
                    Lesson
                  </span>

                </div>

                <span className="text-sm font-bold text-gray-100">
                  {formData.customMinutes} Minutes
                </span>

              </div>

            </>

          )}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <CarFront
                size={14}
                className="text-[#FF6201]"
              />

              <span className="text-xs text-gray-300">
                Pick & Drop
              </span>

            </div>

            <span className="text-sm font-bold text-gray-100">
              {formData.pickup || "-"}
            </span>

          </div>

          <div className="border-t border-white/20 pt-3">

            <p className="text-[10px] uppercase tracking-widest text-gray-300">
              Estimated Fee
            </p>

            <motion.h2
              key={displayPrice}
              initial={{
                y: 10,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              className="
                mt-1
                text-2xl
                font-black
                text-[#FF6201]
              "
            >
              Rs. {displayPrice.toLocaleString()}
            </motion.h2>

          </div>

        </div>

      </motion.div>

    </AnimatePresence>
  );
}

export default BookingSummary;
