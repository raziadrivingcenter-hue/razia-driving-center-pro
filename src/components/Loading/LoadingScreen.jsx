import Steering from "../../assets/Steering.svg";
import PremiumCar from "./PremiumCar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "../../assets/logo-white.png";

const loadingTexts = [
  "Welcome to Razia Driving Center",
  "Preparing Professional Lessons",
  "Loading Driving Experience",
  "Almost Ready...",
];

function LoadingScreen() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.03,
        filter: "blur(10px)",
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
      className="
      fixed
      inset-0
      z-[99999]
      flex
      flex-col
      items-center
      justify-center
      overflow-hidden
      bg-gradient-to-br
      from-[#FF3131]
      to-[#FF6201]
      pointer-events-none
      will-change-transform
      "
    >
      {/* Large Background Ring */}

      

      {/* Glow 1 */}

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.55, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className="
        absolute
        h-96
        w-96
        rounded-full
        bg-white/20
        blur-[120px]
        "
      />

      {/* Glow 2 */}

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
        }}
        className="
        absolute
        h-[500px]
        w-[500px]
        rounded-full
        bg-orange-300/20
        blur-[150px]
        "
      />

      {/* Steering Wheel */}

<motion.img
  src={Steering}
  alt="Steering Wheel"
  draggable={false}
  animate={{
    rotate: 360,
    scale: [1, 1.04, 1],
  }}
  transition={{
    rotate: {
      repeat: Infinity,
      duration: 2.2,
      ease: "linear",
    },
    scale: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
    },
  }}
  className="
    mb-8
    w-24
    select-none
    drop-shadow-[0_15px_35px_rgba(255,255,255,0.35)]
  "
/>

      {/* Logo */}

      <motion.img
        src={logo}
        alt="Razia Driving Center"
        initial={{
          opacity: 0,
          scale: 0.7,
          y: 35,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 1,
          ease: "easeOut",
        }}
        className="
        w-60
        select-none
        drop-shadow-[0_20px_50px_rgba(255,255,255,.40)]
        "
      />

      {/* Animated Loading Text */}

      <motion.p
        key={textIndex}
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
        mt-10
        text-sm
        font-semibold
        uppercase
        tracking-[0.35em]
        text-white/90
        text-center
        "
      >
        {loadingTexts[textIndex]}
      </motion.p>

      {/* ========================= */}
{/* Premium Driving Road */}
{/* ========================= */}

<div className="relative mt-12 w-[360px]">

  {/* Road */}

  <div
    className="
    relative
    h-5
    overflow-hidden
    rounded-full
    bg-white/15
    backdrop-blur-xl
    "
  >

    {/* Moving Lane */}

    <motion.div
      animate={{
        x: [-60, 0],
      }}
      transition={{
        repeat: Infinity,
        duration: 0.45,
        ease: "linear",
      }}
      className="
      absolute
      inset-0
      flex
      items-center
      gap-5
      "
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="
          h-[3px]
          w-8
          rounded-full
          bg-white/70
          "
        />
      ))}
    </motion.div>

  </div>

  {/* Car + Road Reflection */}

<motion.div
  initial={{ x: -30 }}
  animate={{
    x: 290,
  }}
  transition={{
    x: {
      duration: 1.8,
      ease: "easeInOut",
    },
  }}
  className="
    absolute
    -top-8
    z-20
  "
>

  {/* Road Reflection */}

  <motion.div
    animate={{
      opacity: [0.18, 0.35, 0.18],
      scaleX: [1, 1.15, 1],
    }}
    transition={{
      repeat: Infinity,
      duration: 0.9,
    }}
    className="
      absolute
      left-8
      top-10
      h-3
      w-10
      rounded-full
      bg-gradient-to-r
      from-yellow-200/50
      via-yellow-100/20
      to-transparent
      blur-xl
    "
  />

  <PremiumCar />

</motion.div>

</div>
    </motion.div>
  );
}

export default LoadingScreen;