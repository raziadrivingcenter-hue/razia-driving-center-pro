import { useEffect, useRef, useState } from "react";

// Smoothly counts from the previous value to the target value using an
// ease-out curve. Not a visible component — just a number animator.
//
// - Animates both upward and downward.
// - If the target changes mid-animation, the new animation picks up from the
//   current in-flight value so there is no jump.
// - Snaps to the exact target at the end so the final value always matches the
//   real calculation.
// - Honors prefers-reduced-motion: when set, the value jumps straight to the
//   target with no animation.

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function useCountUp(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia) &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduceMotion || displayRef.current === target) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    const from = displayRef.current;
    startRef.current = null;

    const animate = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp;

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const current = from + (target - from) * easeOutCubic(progress);

      setDisplay(current);
      displayRef.current = current;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
        displayRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, reduceMotion]);

  return display;
}
