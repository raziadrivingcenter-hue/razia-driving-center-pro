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
          formData.course === "Economy Driving Course"
            ? 14500
            : formData.course === "Pro Driver Course"
            ? 26500
            : formData.course === "Own Vehicle Training"
            ? 13989
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
          rounded-3xl
          border
          border-orange-100
          bg-gradient-to-br
          from-white
          to-orange-50
          shadow-lg
        "
      >

        <div
          className="
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-5
            py-3
            text-white
          "
        >

          <div className="flex items-center justify-between">

            <h3 className="font-black">
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
                  px-3
                  py-1
                  text-xs
                  font-bold
                  text-[#FF6201]
                "
              >
                CUSTOM
              </motion.div>
            )}

          </div>

        </div>

        <div className="space-y-4 p-5">

          <div className="flex items-center justify-between">

            <span className="text-gray-500">
              Course
            </span>

            <span className="font-bold">
              {formData.course}
            </span>

          </div>

          {isCustom && (

            <>
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <CalendarDays
                    size={16}
                    className="text-[#FF6201]"
                  />

                  <span className="text-gray-500">
                    Days
                  </span>

                </div>

                <span className="font-bold">
                  {formData.customDays}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Clock3
                    size={16}
                    className="text-[#FF6201]"
                  />

                  <span className="text-gray-500">
                    Lesson
                  </span>

                </div>

                <span className="font-bold">
                  {formData.customMinutes} Minutes
                </span>

              </div>

            </>

          )}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <CarFront
                size={16}
                className="text-[#FF6201]"
              />

              <span className="text-gray-500">
                Pick & Drop
              </span>

            </div>

            <span className="font-bold">
              {formData.pickup || "-"}
            </span>

          </div>

          <div className="border-t border-orange-100 pt-4">

            <p className="text-xs uppercase tracking-widest text-gray-500">
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
                mt-2
                text-3xl
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