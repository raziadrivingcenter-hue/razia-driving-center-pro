import { motion } from "framer-motion";

function DustParticle({ delay }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 0,
        y: 0,
        scale: 0.3,
      }}
      animate={{
        opacity: [0, 0.55, 0],
        x: -35,
        y: -10,
        scale: [0.4, 1.2, 2],
      }}
      transition={{
        repeat: Infinity,
        duration: 0.8,
        ease: "easeOut",
        delay,
      }}
      className="
      absolute
      h-3
      w-3
      rounded-full
      bg-white/50
      blur-[2px]
      "
    />
  );
}

function DustTrail() {
  return (
    <div className="absolute left-0 top-5">

      <DustParticle delay={0} />
      <DustParticle delay={0.15} />
      <DustParticle delay={0.30} />
      <DustParticle delay={0.45} />
      <DustParticle delay={0.60} />

    </div>
  );
}

export default DustTrail;