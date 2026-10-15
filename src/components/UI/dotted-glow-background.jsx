import { useEffect, useRef, useState } from "react";

/**
 * Canvas-based dotted background that randomly glows and dims.
 * - Grid mode: stable grid of dots (default).
 * - Scatter mode: randomly placed dots clustered toward the center,
 *   thinning out at the edges — looks like a cloud around content.
 * - Each dot gets its own phase + speed producing organic shimmering.
 * - Handles high-DPI and resizes via ResizeObserver.
 */
export const DottedGlowBackground = ({
  className,
  style,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
  scatter = false,
  scatterCount = 320,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [resolvedColor, setResolvedColor] = useState(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState(glowColor);

  // Resolve CSS variable value from the container or root
  const resolveCssVariable = (el, variableName) => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--")
      ? variableName
      : `--${variableName}`;
    const fromEl = getComputedStyle(el).getPropertyValue(normalized).trim();
    if (fromEl) return fromEl;
    const root = document.documentElement;
    const fromRoot = getComputedStyle(root).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  };

  // Keep resolved colors in sync with theme changes and prop updates
  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;

    const compute = () => {
      const isDark = detectDarkMode();

      let nextColor = color;
      let nextGlow = glowColor;

      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }

      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };

    compute();

    const mql = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const handleMql = () => compute();
    mql?.addEventListener?.("change", handleMql);

    const mo = new MutationObserver(() => compute());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      mql?.removeEventListener?.("change", handleMql);
      mo.disconnect();
    };
  }, [
    color,
    darkColor,
    glowColor,
    darkGlowColor,
    colorLightVar,
    colorDarkVar,
    glowColorLightVar,
    glowColorDarkVar,
  ]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    let isVisible = true;

    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // Precompute dot metadata and regenerate on resize
    let dots = [];

    // Per-dot edge fade: returns 1 near center, ramping to 0 at the edges.
    // normDist is the elliptical distance from center (0 at center, ~1+ at edges).
    const edgeFade = (normDist) =>
      Math.max(0, 1 - Math.pow(normDist * 1.15, 2.4));

    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      const span = Math.max(max - min, 0);
      const cx = width / 2;
      const cy = height / 2;
      const halfW = width / 2;
      const halfH = height / 2;

      if (scatter) {
        // Cloud mode: random positions, denser near center, thinning at edges.
        // Use pow() to bias the radius toward the middle.
        for (let i = 0; i < scatterCount; i++) {
          const r = Math.pow(Math.random(), 1.8) * Math.max(width, height) * 0.6;
          const theta = Math.random() * Math.PI * 2;
          // elliptical spread so it covers the canvas nicely
          const x = cx + Math.cos(theta) * r * 1.1;
          const y = cy + Math.sin(theta) * r * 0.8;
          const phase = Math.random() * Math.PI * 2;
          const speed = min + Math.random() * span;
          const normDist =
            Math.sqrt(((x - cx) / halfW) ** 2 + ((y - cy) / halfH) ** 2);
          dots.push({ x, y, phase, speed, fade: edgeFade(normDist) });
        }
      } else {
        // Grid mode (original) — also faded at the edges.
        const cols = Math.ceil(width / gap) + 2;
        const rows = Math.ceil(height / gap) + 2;
        for (let i = -1; i < cols; i++) {
          for (let j = -1; j < rows; j++) {
            const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
            const y = j * gap;
            const phase = Math.random() * Math.PI * 2;
            const speed = min + Math.random() * span;
            const normDist =
              Math.sqrt(((x - cx) / halfW) ** 2 + ((y - cy) / halfH) ** 2);
            dots.push({ x, y, phase, speed, fade: edgeFade(normDist) });
          }
        }
      }
    };

    regenDots();

    const draw = (now) => {
      if (stopped) return;
      if (!isVisible) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const { width, height } = container.getBoundingClientRect();

      ctx.clearRect(0, 0, el.width, el.height);
      ctx.globalAlpha = opacity;

      // optional subtle background fade for depth
      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          Math.min(width, height) * 0.1,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(
          1,
          `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // animate dots
      ctx.save();
      ctx.fillStyle = resolvedColor;

      const time = (now / 1000) * Math.max(speedScale, 0);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // Linear triangle wave 0..1..0 for linear glow/dim
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod; // 0..1..0
        const a = (0.25 + 0.55 * lin) * d.fade; // shimmer * edge fade

        // skip dots that have fully faded at the edges
        if (a <= 0.01) continue;

        // draw glow when bright
        if (a > 0.6) {
          const glow = (a - 0.6) / 0.4; // 0..1
          ctx.shadowColor = resolvedGlowColor;
          ctx.shadowBlur = 6 * glow;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      regenDots();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    window.addEventListener("resize", handleResize);
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      ro.disconnect();
    };
  }, [
    gap,
    radius,
    resolvedColor,
    resolvedGlowColor,
    opacity,
    backgroundOpacity,
    speedMin,
    speedMax,
    speedScale,
    scatter,
    scatterCount,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default DottedGlowBackground;
