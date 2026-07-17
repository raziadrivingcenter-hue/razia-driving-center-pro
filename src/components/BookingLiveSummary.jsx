import React from "react";
import { AnimatePresence, motion, animate } from "framer-motion";

import {
  User,
  Phone,
  MapPin,
  Car,
  Clock3,
  Calendar,
  Timer,
  CheckCircle2,
} from "lucide-react";
function AnimatedPrice({ value }) {
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.55,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplay(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value]);

  return (
    <AnimatePresence mode="wait">

      <motion.span
        key={display}
        initial={{
          y: 18,
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          y: 0,
          opacity: 1,
          scale: 1,
        }}
        exit={{
          y: -18,
          opacity: 0,
        }}
        transition={{
          duration: 0.28,
        }}
        className="
          inline-block
          font-bold
          text-[#FF6201]
        "
      >
        Rs. {display.toLocaleString()}
      </motion.span>

    </AnimatePresence>
  );
}
function BookingLiveSummary({ formData }) {
  const completed =
    [
      formData.name,
      formData.phone,
      formData.area,
      formData.course,
      formData.pickup,
      formData.time,
    ].filter(Boolean).length;

  const progress = Math.round((completed / 6) * 100);

  return (
    <div
      className="
      overflow-hidden
      rounded-3xl
      border
      border-orange-100
      bg-gradient-to-br
      from-orange-50
      via-white
      to-orange-50
      shadow-lg
    "
    >
      {/* Header */}

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

          <h3 className="font-black tracking-wide">
            Live Booking Summary
          </h3>

          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            {progress}% Complete
          </span>

        </div>

        <div className="mt-3 h-2 rounded-full bg-white/20">

          <div
            style={{
              width: `${progress}%`,
            }}
            className="
              h-full
              rounded-full
              bg-white
              transition-all
              duration-500
            "
          />

        </div>

      </div>

      {/* Body */}

      <div className="space-y-3 p-5 text-sm">

        <SummaryRow
          icon={<User size={16} />}
          title="Name"
          value={formData.name}
        />

        <SummaryRow
          icon={<Phone size={16} />}
          title="Phone"
          value={formData.phone}
        />

        <SummaryRow
          icon={<MapPin size={16} />}
          title="Area"
          value={formData.area}
        />

        <SummaryRow
          icon={<Car size={16} />}
          title="Course"
          value={formData.course}
        />

        {formData.course === "Custom Course" && (
          <>
            <SummaryRow
              icon={<Calendar size={16} />}
              title="Training"
              value={`${formData.customDays} Days`}
            />

            <SummaryRow
              icon={<Timer size={16} />}
              title="Duration"
              value={`${formData.customMinutes} Minutes`}
            />

            <motion.div
  layout
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.28 }}
  whileHover={{ scale: 1.02 }}
  className="
    flex
    items-center
    justify-between
    rounded-2xl
    bg-white
    px-4
    py-3
    shadow-sm
  "
>

  <div className="flex items-center gap-3">

    <div
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-xl
        bg-orange-100
        text-[#FF6201]
      "
    >
      <CheckCircle2 size={16} />
    </div>

    <div>

      <p className="text-xs uppercase tracking-wide text-gray-400">
        Price
      </p>

      <p className="font-semibold text-gray-800">
        <AnimatedPrice
          value={Number(formData.customPrice || 0)}
        />
      </p>

    </div>

  </div>

  <CheckCircle2
    size={18}
    className="text-green-500"
  />

</motion.div>
          </>
        )}

        <SummaryRow
          icon={<Clock3 size={16} />}
          title="Preferred Time"
          value={formData.time}
        />

      </div>

    </div>
  );
}

function SummaryRow({
  icon,
  title,
  value,
}) {
  return (
    <motion.div
  layout

  initial={{
    opacity: 0,
    y: 12,
  }}

  animate={{
    opacity: 1,
    y: 0,
  }}

  transition={{
    duration: 0.28,
  }}

  whileHover={{
    scale: 1.02,
  }}

  className="
    flex
    items-center
    justify-between
    rounded-2xl
    bg-white
    px-4
    py-3
    shadow-sm
  "
>
      <div className="flex items-center gap-3">

        <div
          className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
          bg-orange-100
          text-[#FF6201]
        "
        >
          {icon}
        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-gray-400">
            {title}
          </p>

          <p className="font-semibold text-gray-800">
            {value || "Not Selected"}
          </p>

        </div>

      </div>

      {value && (
        <CheckCircle2
          size={18}
          className="text-green-500"
        />
      )}

    </motion.div>
  );
}

export default BookingLiveSummary;