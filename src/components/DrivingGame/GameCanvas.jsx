// =============================================================================
// GameCanvas — top-down driving practice (L-Track + Parking).
// Pure canvas + requestAnimationFrame. No external engine.
// =============================================================================

import { useEffect, useRef, useState } from "react";

/* ── Canvas dimensions ── */
const W = 800;
const H = 500;

/* ── Car ── */
const CAR_LEN = 40;
const CAR_WID = 22;
const ACCEL = 0.18;
const BRAKE = 0.25;
const FRICTION = 0.025;
const MAX_FWD = 3.2;
const MAX_REV = -1.8;
const TURN_RATE = 0.045; // radians per frame at full speed

/* ── Level definitions ── */
// Walls are axis-aligned rectangles { x, y, w, h } in canvas pixels.
// Finish is a rectangle the car must sit inside (and be near-stopped).

function getLevel(mode) {
  if (mode === "ltrack") {
    return {
      walls: [
        // Outer boundary
        { x: 0, y: 0, w: W, h: 10 },
        { x: 0, y: H - 10, w: W, h: 10 },
        { x: 0, y: 0, w: 10, h: H },
        { x: W - 10, y: 0, w: 10, h: H },
        // Inner walls forming the L
        { x: 10, y: 10, w: 560, h: 20 },          // top horizontal bar (leaving right gap)
        { x: 10, y: 10, w: 20, h: 340 },          // left vertical bar (leaving bottom gap)
        { x: 250, y: 200, w: 20, h: 290 },        // divider creating the L bend
        { x: 250, y: 200, w: 310, h: 20 },        // shelf at the bend
      ],
      finish: { x: 270, y: 410, w: 280, h: 70 },
      car: { x: 620, y: 60, angle: Math.PI / 2 }, // start top-right, facing down
    };
  }

  // Parking
  return {
    walls: [
      // Outer boundary
      { x: 0, y: 0, w: W, h: 10 },
      { x: 0, y: H - 10, w: W, h: 10 },
      { x: 0, y: 0, w: 10, h: H },
      { x: W - 10, y: 0, w: 10, h: H },
      // Parking bay (three walls forming a pocket on the left)
      { x: 120, y: 120, w: 20, h: 160 },         // bay back wall
      { x: 120, y: 120, w: 220, h: 20 },         // bay top wall
      { x: 120, y: 280, w: 220, h: 20 },         // bay bottom wall
    ],
    finish: { x: 140, y: 140, w: 180, h: 140 },
    car: { x: 600, y: 380, angle: Math.PI },     // start bottom-right, facing left
  };
}

/* ── Helpers ── */

function cornersOf(car) {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const hx = CAR_LEN / 2;
  const hy = CAR_WID / 2;
  // Local corners: (+hx,+hy), (+hx,-hy), (-hx,-hy), (-hx,+hy)
  return [
    { x: car.x + cos * hx - sin * hy, y: car.y + sin * hx + cos * hy },
    { x: car.x + cos * hx + sin * hy, y: car.y + sin * hx - cos * hy },
    { x: car.x - cos * hx + sin * hy, y: car.y - sin * hx - cos * hy },
    { x: car.x - cos * hx - sin * hy, y: car.y - sin * hx + cos * hy },
  ];
}

// Separating Axis Theorem: does rotated rect (car) overlap an axis-aligned rect (wall)?
function rectsOverlap(car, wall) {
  const pts = cornersOf(car);
  // Car axes (2 unique) + wall axes (2 unique, axis-aligned)
  const axes = [
    { x: Math.cos(car.angle), y: Math.sin(car.angle) },
    { x: -Math.sin(car.angle), y: Math.cos(car.angle) },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  for (const ax of axes) {
    // Project car
    let cMin = Infinity, cMax = -Infinity;
    for (const p of pts) {
      const d = p.x * ax.x + p.y * ax.y;
      if (d < cMin) cMin = d;
      if (d > cMax) cMax = d;
    }
    // Project wall (axis-aligned rect → project its 4 corners)
    const wCorners = [
      { x: wall.x, y: wall.y },
      { x: wall.x + wall.w, y: wall.y },
      { x: wall.x + wall.w, y: wall.y + wall.h },
      { x: wall.x, y: wall.y + wall.h },
    ];
    let wMin = Infinity, wMax = -Infinity;
    for (const p of wCorners) {
      const d = p.x * ax.x + p.y * ax.y;
      if (d < wMin) wMin = d;
      if (d > wMax) wMax = d;
    }
    if (cMax < wMin || wMax < cMin) return false; // separated
  }
  return true;
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function carInFinish(car, finish) {
  const pts = cornersOf(car);
  return pts.every((p) => pointInRect(p.x, p.y, finish));
}

/* ── Component ── */

export default function GameCanvas({ mode }) {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const carRef = useRef(null);
  const levelRef = useRef(null);
  const hitsRef = useRef(0);
  const hitFlashRef = useRef(0);
  const completedRef = useRef(false);
  const rafRef = useRef(0);

  // React state for the overlay UI (driven from the game loop via setState throttled)
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    levelRef.current = getLevel(mode);
    carRef.current = { ...levelRef.current.car, speed: 0 };
    hitsRef.current = 0;
    hitFlashRef.current = 0;
    completedRef.current = false;
    setHits(0);
    setFlash(false);
    setDone(false);
  }

  // Reset whenever mode changes
  useEffect(() => {
    reset();
  }, [mode]);

  // Keyboard handlers
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      }
    };
    const up = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function frame() {
      const car = carRef.current;
      const level = levelRef.current;
      if (!car || !level) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const keys = keysRef.current;

      // --- Physics ---
      if (keys["arrowup"] || keys["w"]) {
        car.speed = Math.min(car.speed + ACCEL, MAX_FWD);
      } else if (keys["arrowdown"] || keys["s"]) {
        car.speed = Math.max(car.speed - BRAKE, MAX_REV);
      } else {
        // Friction
        if (car.speed > 0) car.speed = Math.max(0, car.speed - FRICTION);
        else if (car.speed < 0) car.speed = Math.min(0, car.speed + FRICTION);
      }

      // Steering — only when moving. Reverse steers like a real car.
      if (Math.abs(car.speed) > 0.05) {
        const dir = car.speed > 0 ? 1 : -1;
        const amount = TURN_RATE * dir;
        if (keys["arrowleft"] || keys["a"]) car.angle -= amount;
        if (keys["arrowright"] || keys["d"]) car.angle += amount;
      }

      // Move
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // --- Collision ---
      let hit = false;
      for (const wall of level.walls) {
        if (rectsOverlap(car, wall)) {
          hit = true;
          break;
        }
      }

      if (hit && hitFlashRef.current <= 0 && !completedRef.current) {
        hitsRef.current += 1;
        hitFlashRef.current = 30; // frames of flash
        setHits(hitsRef.current);
      }
      if (hitFlashRef.current > 0) {
        hitFlashRef.current -= 1;
        if (hitFlashRef.current === 0) setFlash(false);
      }

      // --- Completion ---
      if (
        !completedRef.current &&
        carInFinish(car, level.finish) &&
        Math.abs(car.speed) < 0.15
      ) {
        completedRef.current = true;
        setDone(true);
      }

      // --- Draw ---
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, 0, W, H);

      // Finish zone
      ctx.fillStyle = completedRef.current ? "#bbf7d0" : "#fef3c7";
      ctx.fillRect(level.finish.x, level.finish.y, level.finish.w, level.finish.h);
      ctx.strokeStyle = completedRef.current ? "#16a34a" : "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(level.finish.x, level.finish.y, level.finish.w, level.finish.h);
      ctx.setLineDash([]);

      // Walls
      ctx.fillStyle = "#1f2937";
      for (const wall of level.walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      }

      // Car
      const pts = cornersOf(car);
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      // Body
      ctx.fillStyle = completedRef.current ? "#16a34a" : (hitFlashRef.current > 0 ? "#dc2626" : "#2563eb");
      ctx.fillRect(-CAR_LEN / 2, -CAR_WID / 2, CAR_LEN, CAR_WID);
      // Front indicator (windshield)
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(CAR_LEN / 2 - 10, -CAR_WID / 2 + 3, 7, CAR_WID - 6);
      ctx.restore();

      // Hit flash overlay
      if (hitFlashRef.current > 0) {
        ctx.fillStyle = "rgba(220, 38, 38, 0.18)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Hit!", W / 2, 40);
      }

      // Completed overlay
      if (completedRef.current) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Completed!", W / 2, H / 2 - 10);
        ctx.font = "18px sans-serif";
        ctx.fillText(
          `Hits: ${hitsRef.current}`,
          W / 2,
          H / 2 + 20
        );
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative" style={{ width: W, maxWidth: "100%" }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block rounded-2xl border border-gray-200 shadow-md"
        style={{ width: W, height: H, maxWidth: "100%", touchAction: "none" }}
      />
      {/* Controls below canvas */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Hits: <span className="font-bold text-gray-900">{hits}</span>
        </span>
        <div className="flex gap-2">
          {(flash || hitFlashRef.current > 0) && (
            <span className="mr-2 self-center text-xs font-semibold text-red-600">
              Hit!
            </span>
          )}
          <button
            onClick={reset}
            className="
              rounded-lg
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-4
              py-2
              text-sm
              font-bold
              text-white
              shadow
              transition-transform
              duration-200
              hover:-translate-y-0.5
            "
          >
            {done ? "Play Again" : "Restart"}
          </button>
        </div>
      </div>
    </div>
  );
}
