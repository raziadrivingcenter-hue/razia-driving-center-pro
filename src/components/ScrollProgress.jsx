import { useEffect, useState } from "react";

function ScrollProgress() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const progress =
        (window.scrollY / totalHeight) * 100;

      setScroll(progress);
    };

    window.addEventListener("scroll", updateScroll);

    return () =>
      window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <div
      className="fixed left-0 top-0 z-[9999] h-1 bg-gradient-to-r from-[#FF3131] to-[#FF6201] transition-all duration-150"
      style={{
        width: `${scroll}%`,
      }}
    />
  );
}

export default ScrollProgress;