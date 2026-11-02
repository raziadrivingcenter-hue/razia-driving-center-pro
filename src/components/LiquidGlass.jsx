import { useState, useEffect, useId } from "react";

/* ==========================================================================
   LIQUID GLASS — SVG backdrop-filter displacement, ported from the
   "fluid glass displacement" CodePen technique.

   A displacement map (an SVG data URI) is built for the card size and fed
   to an SVG filter. Three feDisplacementMap passes with slightly different
   scales give the chromatic aberration, then the channels are blended back
   together with screen and a light output blur.

   The map is cached by size and only rebuilt when the card size changes.
   The filter is applied inline to the card that carries the scroll transform.
   ========================================================================== */

const SCALE = -180; // pen default; negative = bends inward
const R_OFF = 0,
  G_OFF = 10,
  B_OFF = 20;
const RADIUS = 16; // pen dock value; set 8 for sharper corners like the CTA buttons
const BORDER = 0.07; // fraction of the short side
const LIGHTNESS = 50;
const ALPHA = 0.93;
const INPUT_BLUR = 11;
const OUTPUT_BLUR = 0.2; // feGaussianBlur on output (pen: "displace")
export const FROST = 0.05;
export const SATURATION = 1; // pen default; try 1.5
const BLEND = "difference";
const X_CH = "R",
  Y_CH = "B";

/* --------------------------- displacement map -------------------------- */

const mapCache = new Map(); // "WxH" -> data URI

// eslint-disable-next-line react-refresh/only-export-components
export function buildLiquidGlassMap(W, H) {
  const key = W + "x" + H;
  const cached = mapCache.get(key);
  if (cached) return cached;

  const border = Math.min(W, H) * (BORDER * 0.5);
  const svg = `
<svg class="displacement-image" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="black"></rect>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RADIUS}" fill="url(#red)"></rect>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RADIUS}" fill="url(#blue)" style="mix-blend-mode: ${BLEND}"></rect>
  <rect x="${border}" y="${border}" width="${W - border * 2}" height="${
    H - border * 2
  }" rx="${RADIUS}" fill="hsl(0 0% ${LIGHTNESS}% / ${ALPHA})" style="filter:blur(${INPUT_BLUR}px)"></rect>
</svg>`;

  const holder = document.createElement("div");
  holder.innerHTML = svg;
  const svgEl = holder.firstElementChild;
  const serialized = new XMLSerializer().serializeToString(svgEl);
  const dataUri = "data:image/svg+xml," + encodeURIComponent(serialized);
  mapCache.set(key, dataUri);
  return dataUri;
}

/* -------------------------------- hook --------------------------------- */

// eslint-disable-next-line react-refresh/only-export-components
export function useLiquidGlass(ref) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setMap(null);
      return undefined;
    }

    let timer = null;
    let cancelled = false;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const W = Math.round(rect.width);
      const H = Math.round(rect.height);
      if (!W || !H) return;
      const dataUri = buildLiquidGlassMap(W, H);
      if (cancelled) return;
      setMap({ W, H, dataUri });
    };

    measure();

    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [ref]);

  return map;
}

/* --------------------------- support check ----------------------------- */

let supportedCache = null;

// eslint-disable-next-line react-refresh/only-export-components
export function isLiquidGlassSupported() {
  if (supportedCache !== null) return supportedCache;
  if (typeof window === "undefined" || typeof document === "undefined") {
    supportedCache = false;
    return false;
  }
  try {
    if (document.documentElement.dataset.liquid === "off") {
      supportedCache = false;
      return false;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches
    ) {
      supportedCache = false;
      return false;
    }
    if (
      typeof navigator !== "undefined" &&
      navigator.deviceMemory &&
      navigator.deviceMemory <= 4
    ) {
      supportedCache = false;
      return false;
    }
    if (
      !(
        window.CSS &&
        typeof window.CSS.supports === "function" &&
        window.CSS.supports("backdrop-filter", "url(#x)")
      )
    ) {
      supportedCache = false;
      return false;
    }
    let chromium = false;
    if (navigator.userAgentData && Array.isArray(navigator.userAgentData.brands)) {
      chromium = navigator.userAgentData.brands.some((b) =>
        /Chromium|Chrome|Edg|Edge|Opera/i.test(b.brand || "")
      );
    }
    if (!chromium) {
      chromium = /Chrome|Chromium|Edg|Opera|CriOS/i.test(navigator.userAgent || "");
    }
    supportedCache = chromium;
  } catch {
    supportedCache = false;
  }
  return supportedCache;
}

/* --------------------------- filter markup ----------------------------- */

export function LiquidGlassFilter({ id, width, height }) {
  const dataUri = buildLiquidGlassMap(width, height);
  return (
    <filter id={id} color-interpolation-filters="sRGB">
      <feImage
        href={dataUri}
        x="0"
        y="0"
        width="100%"
        height="100%"
        result="map"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale={SCALE + R_OFF}
        xChannelSelector={X_CH}
        yChannelSelector={Y_CH}
        result="dispRed"
      />
      <feColorMatrix
        in="dispRed"
        type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        result="red"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale={SCALE + G_OFF}
        xChannelSelector={X_CH}
        yChannelSelector={Y_CH}
        result="dispGreen"
      />
      <feColorMatrix
        in="dispGreen"
        type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
        result="green"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale={SCALE + B_OFF}
        xChannelSelector={X_CH}
        yChannelSelector={Y_CH}
        result="dispBlue"
      />
      <feColorMatrix
        in="dispBlue"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
        result="blue"
      />
      <feBlend in="red" in2="green" mode="screen" result="rg" />
      <feBlend in="rg" in2="blue" mode="screen" result="output" />
      <feGaussianBlur in="output" stdDeviation={OUTPUT_BLUR} />
    </filter>
  );
}

/* ------------------------------ helpers -------------------------------- */

// eslint-disable-next-line react-refresh/only-export-components
export function useLiquidGlassId() {
  const raw = useId();
  return "rdc-glass-" + raw.replace(/[^a-zA-Z0-9]/g, "");
}

// eslint-disable-next-line react-refresh/only-export-components
export function isGlassDebug() {
  if (typeof window === "undefined") return false;
  try {
    return (
      new URLSearchParams(window.location.search).get("glassdebug") === "1"
    );
  } catch {
    return false;
  }
}
