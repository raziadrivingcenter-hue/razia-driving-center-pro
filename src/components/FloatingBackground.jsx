function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">

      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-[#FF6201]/20 blur-3xl animate-float"></div>

      <div className="absolute top-40 right-20 h-80 w-80 rounded-full bg-[#FF3131]/20 blur-3xl animate-float-slow"></div>

      <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl animate-float"></div>

    </div>
  );
}

export default FloatingBackground;