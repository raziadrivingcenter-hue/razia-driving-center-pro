import { useEffect, useState } from "react";

// Returns true only when the viewport is >= 1024px AND the user has NOT
// requested reduced motion. Re-checks on resize and on the OS-level
// reduced-motion toggle so the answer is always current without a remount.
export function useDesktopMotion() {
  const compute = () => {
    if (typeof window === "undefined") return false;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return wide && !reduced;
  };

  const [enabled, setEnabled] = useState(compute);

  useEffect(() => {
    const mqWidth = window.matchMedia("(min-width: 1024px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handler = () => setEnabled(compute());
    mqWidth.addEventListener("change", handler);
    mqReduced.addEventListener("change", handler);
    return () => {
      mqWidth.removeEventListener("change", handler);
      mqReduced.removeEventListener("change", handler);
    };
  }, []);

  return enabled;
}
