import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Minus,
  Plus,
  Clock3,
} from "lucide-react";

function CustomCourseCard({ onBook }) {
  const [minutes, setMinutes] = useState(20);
  const [days, setDays] = useState(5);

  // Pricing Formula
  const BASE_MINUTES = 30;
  const BASE_DAYS = 10;
  const BASE_PRICE = 14500;

  const calculatedPrice = Math.round(
    BASE_PRICE *
      (minutes / BASE_MINUTES) *
      (days / BASE_DAYS)
  );

  const originalPrice = Math.round(calculatedPrice * 1.15);

  const increaseMinutes = () => {
    if (minutes < 120) setMinutes(minutes + 10);
  };

  const decreaseMinutes = () => {
    if (minutes > 20) setMinutes(minutes - 10);
  };

  const progress = Math.min(
  100,
  Math.round(
    ((((days - 5) / 25) + ((minutes - 20) / 100)) / 2) * 100
  )
);

  return (
    <div
      className="
      rounded-2xl
      border
      border-orange-100
      bg-white
      p-4 lg:p-6
      shadow-xl
      transition-all
      duration-500
      hover:-translate-y-2
      hover:shadow-2xl
    "
    >
      {/* Premium Header */}

      
<div className="mt-2">

  <div className="mb-1 flex justify-between">

    <span className="text-sm font-semibold text-gray-500">
      Customization
    </span>

    <span className="font-bold text-[#FF6201]">
      {progress}%
    </span>

  </div>

  <div className="h-2 overflow-hidden rounded-full bg-orange-100">

    <div
      style={{ width: `${progress}%` }}
      className="
        h-full
        rounded-full
        bg-gradient-to-r
        from-[#FF3131]
        to-[#FF6201]
        transition-all
        duration-500
      "
    />

  </div>

</div>

<div className="mb-2">

  <span
    className="
    inline-flex
    items-center
    rounded-full
    bg-gradient-to-r
    from-[#FF3131]
    to-[#FF6201]
    px-3
    py-1
    text-xs
    font-bold
    uppercase
    tracking-[0.3em]
    text-white
    shadow-lg
    "
  >
    Build Your Course
  </span>

  <h2 className="mt-1 text-3xl font-black leading-6">
    Custom Driving
    <br />
    Experience
  </h2>

  <p className="mt-2 text-[16px] leading-5 text-gray-600">
    Design a training plan that perfectly matches your schedule, learning speed, and confidence level.
  </p>

</div>

      {/* Course Duration */}

<div className="mt-1">

  <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
    Course Duration
  </p>

  <div
    className="
    flex
    items-center
    justify-between
    rounded-3xl
    border
    border-orange-100
    bg-gradient-to-r
    from-white
    to-orange-50
    p-1
    shadow-md
    "
  >

    <button
      onClick={() => setDays(Math.max(5, days - 1))}
      className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-2xl
      bg-gray-100
      text-3xl
      font-bold
      transition-all
      duration-300
      hover:scale-110
      hover:bg-[#FF6201]
      hover:text-white
      hover:shadow-lg
      active:scale-95
      "
    >
      −
    </button>

    <div className="text-center">

      <h2 className="text-3xl font-black">
        {days}
      </h2>

      <p className="mt-1 text-sm uppercase tracking-widest text-gray-500">
        Days
      </p>

    </div>

    <button
      onClick={() => setDays(Math.min(30, days + 1))}
      className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-2xl
      bg-gradient-to-r
      from-[#FF3131]
      to-[#FF6201]
      text-3xl
      font-bold
      text-white
      transition-all
      duration-300
      hover:scale-110
      hover:shadow-xl
      active:scale-95
      "
    >
      +
    </button>

  </div>

</div>

      {/* Lesson Duration */}

<div className="mt-1">

  <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
    Lesson Duration
  </p>

  <div
    className="
    flex
    items-center
    justify-between
    rounded-2xl
    border
    border-orange-100
    bg-gradient-to-r
    from-white
    to-orange-50
    p-1
    shadow-md
    "
  >

    <button
      onClick={decreaseMinutes}
      className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-2xl
      bg-gray-100
      text-3xl
      font-bold
      transition-all
      duration-300
      hover:scale-110
      hover:bg-[#FF6201]
      hover:text-white
      hover:shadow-lg
      active:scale-95
      "
    >
      −
    </button>

    <div className="text-center">

      <h2 className="text-3xl font-black">
        {minutes}
      </h2>

      <p className="mt-1 text-sm uppercase tracking-widest text-gray-500">
        Minutes
      </p>

    </div>

    <button
      onClick={increaseMinutes}
      className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-2xl
      bg-gradient-to-r
      from-[#FF3131]
      to-[#FF6201]
      text-3xl
      font-bold
      text-white
      transition-all
      duration-300
      hover:scale-110
      hover:shadow-xl
      active:scale-95
      "
    >
      +
    </button>

  </div>

</div>

      {/* Premium Summary */}

<div
  className="
    mt-1
    rounded-2xl
    border
    border-orange-100
    bg-gradient-to-r
    from-orange-50
    to-white
    p-2
  "
>

  <h4 className="text-sm font-bold uppercase tracking-[0.25em] text-gray-500">
    Your Training Plan
  </h4>

  <div className="mt-1 space-y-1">

    <div className="flex justify-between">

      <span className="text-gray-500">
        Training Days
      </span>

      <span className="font-black">
        {days}
      </span>

    </div>

    <div className="flex justify-between">

      <span className="text-gray-500">
        Lesson Duration
      </span>

      <span className="font-black">
        {minutes} Minutes
      </span>

    </div>

    <div className="flex justify-between">

      <span className="text-gray-500">
        Total Training
      </span>

      <span className="font-black text-[#FF6201]">
        <AnimatePresence mode="wait">

<motion.span
    key={minutes * days}
    initial={{
      opacity:0,
      y:15,
    }}
    animate={{
      opacity:1,
      y:0,
    }}
    exit={{
      opacity:0,
      y:-15,
    }}
    transition={{
      duration:0.25,
    }}
>
{minutes * days} Minutes
</motion.span>

</AnimatePresence>
      </span>

    </div>

    <div className="h-px bg-orange-100" />

    <div className="flex justify-between">

      <span className="text-gray-500">
        Instructor
      </span>

      <span className="font-black">
        Female Trainer
      </span>

    </div>

    <div className="flex justify-between">

      <span className="text-gray-500">
        Training Style
      </span>

      <span className="font-black">
        One-to-One
      </span>

    </div>

  </div>

</div>
{/* Premium Price Card */}


<motion.div

animate={{
  scale:[1,1.02,1],
}}

transition={{
  duration:0.25,
}}

className="
mt-2
overflow-hidden
rounded-2xl
    bg-gradient-to-br
    from-[#FF3131]
    via-[#FF4A22]
    to-[#FF6201]
    p-3
    text-white
    shadow-[0_25px_60px_rgba(255,98,1,0.35)]
  "
>

  <p className="text-xs uppercase tracking-[0.25em] text-white/80">
    Estimated Course Fee
  </p>

  <div className="mt-2x1 flex items-end justify-between">

    <div>

      <div className="relative h-10 overflow-hidden">

  <AnimatePresence mode="wait">

    <motion.h2
      key={calculatedPrice}
      initial={{
        y: 35,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      exit={{
        y: -35,
        opacity: 0,
      }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      className="absolute text-2xl font-black leading-none"
    >
      Rs. {calculatedPrice.toLocaleString()}
    </motion.h2>

  </AnimatePresence>

</div>

      <div className="mt-1 flex items-center gap-1">

        <span className="text-xl text-white/60 line-through">
          Rs. {originalPrice.toLocaleString()}
        </span>

        <span
          className="
            rounded-2xl
            bg-green-500
            px-3
            py-3
            text-xs
            font-black
            uppercase
            tracking-wider
            shadow-lg
          "
        >
          <AnimatePresence mode="wait">

<motion.span
    key={originalPrice - calculatedPrice}
    initial={{
      opacity:0,
      y:12,
    }}
    animate={{
      opacity:1,
      y:0,
    }}
    exit={{
      opacity:0,
      y:-12,
    }}
    transition={{
      duration:0.25,
    }}
>
SAVE Rs. {(originalPrice - calculatedPrice).toLocaleString()}
</motion.span>

</AnimatePresence>
        </span>
<button
    onClick={() =>
      onBook?.({
        course: "Custom Course",
        days,
        minutes,
        price: calculatedPrice,
      })
    }
    className="
      w-full
      rounded-2xl
      bg-white
      py-4
      text-lg
      font-black
      text-[#FF6201]
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:shadow-xl
      active:scale-[0.98]
    "
  >
    BOOK THIS PACKAGE
  </button>
      </div>

    </div>

  </div>

</motion.div>


    </div>
    
  );
}

export default CustomCourseCard;