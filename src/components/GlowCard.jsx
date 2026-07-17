function GlowCard({ children, className = "" }) {
  return (
    <div className={`group relative ${className}`}>

      {/* Glow */}
      <div
        className="
          absolute
          -inset-1
          rounded-3xl
          bg-gradient-to-r
          from-[#FF3131]
          via-[#FF6201]
          to-[#FF3131]
          opacity-0
          blur-xl
          transition-all
          duration-500
          group-hover:opacity-30
        "
      />

      {/* Card */}
      <div
        className="
          relative
          rounded-3xl
          bg-white
          transition-all
          duration-500
          group-hover:-translate-y-2
          group-hover:shadow-2xl
        "
      >
        {children}
      </div>

    </div>
  );
}

export default GlowCard;