import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";

import { RouterProvider } from "../router";
import HeroCoursesScene from "../components/HeroCoursesScene";

// ---------------------------------------------------------------------------
//  vi.mock factories are hoisted above all imports, so any value they close
//  over must be created with vi.hoisted() — otherwise the factory runs before
//  the const is initialized ("Cannot access X before initialization").
// ---------------------------------------------------------------------------
// useTransform call counter — mutated by the mock, read by the test. A plain
// number in a hoisted object avoids vi.fn() timing issues with hoisted mocks.
const { createMotionValue, motionProxy, useTransformCalls } = vi.hoisted(() => {
  const useTransformCalls = { count: 0 };

  function createMotionValue(initial = 0) {
    let value = initial;
    return {
      get: () => value,
      set: (v) => {
        value = v;
      },
      on: () => {},
    };
  }

  // motion.* → plain element forwarding style + ref.
  const motionProxy = new Proxy(
    {},
    {
      get: (_t, tag) =>
        (props, ref) => {
          const { children, style, ...rest } = props ?? {};
          return createElement(
            tag,
            { ...(typeof tag === "string" ? rest : {}), ref, style },
            children
          );
        },
    }
  );

  return { createMotionValue, motionProxy, useTransformCalls };
});

vi.mock("framer-motion", () => ({
  motion: motionProxy,
  useScroll: () => ({ scrollYProgress: createMotionValue(0) }),
  useSpring: () => createMotionValue(0),
  // Faithful to real framer-motion: useTransform calls .get() on its input
  // motion value (via useCombineMotionValues). If the input is undefined —
  // as happened when BackdropShapes received prop `p` instead of `progress` —
  // it throws "Cannot read properties of undefined (reading 'get')".
  useTransform(input) {
    if (input === undefined) {
      throw new TypeError(
        "Cannot read properties of undefined (reading 'get')"
      );
    }
    useTransformCalls.count += 1;
    return createMotionValue(0);
  },
  useMotionValueEvent: () => {},
  useAnimate: () => [{ current: null }, () => Promise.resolve()],
  AnimatePresence: ({ children }) => children,
}));

// ---------------------------------------------------------------------------
//  Mock window.matchMedia (jsdom has none). Both useDesktopMotion and
//  HeroTestimonial query it.
// ---------------------------------------------------------------------------
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => {
    // Desktop viewport (>= 1024px) with reduced-motion OFF, so the
    // useDesktopMotion gate returns true and PinnedScene actually mounts.
    const wide = query.includes("min-width");
    const reduced = query.includes("reduced-motion");
    return {
      matches: wide && !reduced,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
  // Force the desktop + tall-enough branch so PinnedScene mounts.
  window.innerHeight = 1080;
  window.innerWidth = 1920;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
//  Helper: wrap in RouterProvider (Hero's useRouter throws without it).
// ---------------------------------------------------------------------------
function renderScene() {
  return render(
    createElement(RouterProvider, null,
      createElement(HeroCoursesScene, {
        onBookNow: vi.fn(),
        onCustomBooking: vi.fn(),
      })
    )
  );
}

describe("HeroCoursesScene pinned scene", () => {
  it("mounts without crashing (regression: undefined motion value .get())", () => {
    // On the OLD code, <BackdropShapes p={p} /> passed prop `p` while the
    // component read { progress }, so progress was undefined and
    // useTransform(undefined, …) crashed with
    // "Cannot read properties of undefined (reading 'get')".
    // This mount must NOT throw.
    expect(() => renderScene()).not.toThrow();
  });

  it("renders the hero heading in the pinned scene", () => {
    renderScene();
    // HeroLeftColumn renders an h1 with the brand headline.
    const h1 = document.querySelector("h1");
    expect(h1).toBeTruthy();
    expect(h1.textContent.length).toBeGreaterThan(0);
  });

  it("renders all three course cards in the glass slot", () => {
    renderScene();
    // CourseCard renders an h3 with the plan title for each course.
    const cards = document.querySelectorAll("h3");
    const titles = Array.from(cards).map((h) => h.textContent);
    expect(titles).toContain("Basic Plan");
    expect(titles).toContain("PLUS Plan");
    expect(titles).toContain("PRO+ Plan");
  });

  it("renders the whole pinned scene, not the error-boundary fallback", () => {
    useTransformCalls.count = 0;
    renderScene();
    // A full pinned-scene render calls useTransform 12×: PinnedScene 3
    // (leftX, reviewY, reviewOpacity) + 3 cards × 3 (y, rotateX, opacity).
    // If a motion value were ever undefined the error boundary would bail
    // out mid-render and far fewer calls would complete.
    expect(useTransformCalls.count).toBeGreaterThanOrEqual(12);
  });

  it("renders the decorative hero photograph behind the scene", () => {
    renderScene();
    const img = document.querySelector('#home img[loading="eager"]');
    expect(img).toBeTruthy();
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("sizes")).toBe("100vw");
    expect(img.getAttribute("srcset")).toContain("1280w");
    expect(img.getAttribute("srcset")).toContain("2560w");
    // width/height attributes reserve the box → no layout shift.
    expect(img.getAttribute("width")).toBe("2560");
    expect(img.getAttribute("height")).toBe("1440");
  });
});
