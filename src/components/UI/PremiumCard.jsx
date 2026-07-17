import { motion } from "framer-motion";

function PremiumCard({
  children,
  className = "",
}) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-gray-100
        bg-white
        shadow-lg
        transition-all
        duration-300
        hover:border-orange-200
        hover:shadow-2xl
        ${className}
      `}
    >
      {/* Premium Glow */}

      <div
        className="
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
        "
      >
        <div
          className="
            absolute
            -right-20
            -top-20
            h-40
            w-40
            rounded-full
            bg-orange-200/30
            blur-3xl
          "
        />
      </div>

      <div className="relative z-10">

        {children}

      </div>

    </motion.div>
  );
}

export default PremiumCard;