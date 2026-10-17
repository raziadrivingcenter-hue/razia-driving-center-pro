import { motion } from "framer-motion";
import logo from "../../assets/LOGORDC.svg";

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.02,
        filter: "blur(8px)",
      }}
      transition={{
        duration: 0.7,
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
        bg-white
        pointer-events-none
        will-change-transform
      "
    >
      {/* Subtle Background Pattern — Road Lines */}

      <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, #FF6201 1px, transparent 1px),
            linear-gradient(#FF6201 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Soft Brand Glow Orbs */}

      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.08, 0.16, 0.08],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-[#FF6201] blur-[100px]"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.06, 0.12, 0.06],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#FF3131] blur-[120px]"
      />

      {/* Center Content */}

      <div className="relative z-10 flex flex-col items-center">

        {/* Logo with Pulse */}

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {/* Pulse Ring */}

          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
            className="absolute inset-0 -m-4 rounded-full border-2 border-[#FF6201]/20"
          />

          <motion.img
            src={logo}
            alt="Razia Driving Center"
            fetchpriority="high"
            className="
              relative
              w-44
              select-none
              drop-shadow-[0_8px_24px_rgba(255,98,1,0.12)]
            "
          />
        </motion.div>

        {/* Tagline */}

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="
            mt-6
            text-sm
            font-medium
            uppercase
            tracking-[0.3em]
            text-gray-400
          "
        >
          Learn Today. Drive Forever.
        </motion.p>

        {/* Progress Bar */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 w-48"
        >
          <div className="h-1 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
              }}
              className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201]"
            />
          </div>
        </motion.div>

      </div>

      {/* Bottom Branding */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-10 text-center"
      >
        <p className="text-[11px] font-medium tracking-widest text-gray-300">
          RAZIA DRIVING CENTER &bull; LAHORE
        </p>
      </motion.div>

    </motion.div>
  );
}

export default LoadingScreen;
