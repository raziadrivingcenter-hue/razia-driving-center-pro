import { forwardRef, createElement } from "react";

// Minimal motion value — get() returns the last set value, on() is a no-op.
function createMotionValue(initial = 0) {
  let value = initial;
  return {
    get: () => value,
    set: (v) => {
      value = v;
    },
    on: () => {},
    getPrevious: () => value,
    velocity: 0,
  };
}

// motion.div / motion.section / ... → plain element that forwards style + ref.
const motionProxy = new Proxy(
  {},
  {
    get: (_t, tag) => {
      const Comp = forwardRef(function MotionTag(props, ref) {
        const { children, style, className, ...rest } = props;
        return createElement(
          tag,
          { ...(typeof tag === "string" ? rest : {}), ref, style, className },
          children
        );
      });
      Comp.displayName = `motion.${String(tag)}`;
      return Comp;
    },
  }
);

function useScroll() {
  return { scrollYProgress: createMotionValue(0) };
}
function useSpring() {
  return createMotionValue(0);
}
function useTransform() {
  return createMotionValue(0);
}
function useMotionValueEvent() {}
function useAnimate() {
  const ref = { current: null };
  return [ref, () => Promise.resolve()];
}
function AnimatePresence({ children }) {
  return children;
}

export {
  motionProxy as motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useAnimate,
  AnimatePresence,
};
