import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const BASE_MINUTES = 30;
const BASE_DAYS = 10;
const BASE_PRICE = 14500;
const ORIGINAL_PRICE = 16000; // List price — used for the savings display.

// Geometry for the circular progress ring (120px diameter).
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MAX_HOURS_REF = 21; // 21 days × 60 min — fills the ring completely.

function CustomCourseCard({ onBook }) {
  const [minutes, setMinutes] = useState(30);
  const [days, setDays] = useState(10);

  // Pricing — base price scaled proportionally by both the days ratio and the minutes ratio.
  const rawPrice =
    BASE_PRICE * (days / BASE_DAYS) * (minutes / BASE_MINUTES);
  const calculatedPrice = Math.round(rawPrice / 50) * 50;

  // Savings vs. the fixed list price.
  const savings = Math.max(0, ORIGINAL_PRICE - calculatedPrice);

  const totalHours = (days * minutes) / 60;

  // Ring fill percentage (total hours vs. the 21-hour maximum).
  const ringProgress = Math.min(totalHours / MAX_HOURS_REF, 1);
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringProgress);

  // Slider fill percentages for the track gradient.
  const daysPercent = ((days - 7) / (21 - 7)) * 100;
  const minutesPercent = ((minutes - 15) / (60 - 15)) * 100;

  return (
    <div
      className="mx-auto w-full rounded-2xl p-4 md:p-6"
      style={{
        background: "linear-gradient(135deg, #FFF9F5, #FFFBF7)",
      }}
    >
      {/* ===== HEADER ===== */}

      <span className="inline-block rounded-full bg-[#FF5A3D] px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-white shadow-sm">
        Build Your Course
      </span>

      <h2 className="mt-2 text-xl font-bold leading-tight text-[#1A1A1A] md:text-2xl">
        Custom Driving Experience
      </h2>

      <p className="mt-1.5 text-sm leading-snug text-[#666]">
        Design a plan that matches your schedule. Your price updates live.
      </p>

      {/* ===== TWO-COLUMN LAYOUT ===== */}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* ---------- LEFT COLUMN — controls ---------- */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-5">
          {/* Training Duration */}

          <div className="flex flex-col items-center md:items-start">
            <label
              htmlFor="days-slider"
              className="order-1 block text-[10px] font-semibold uppercase tracking-wide text-[#999]"
            >
              Training Duration
            </label>

            <div className="order-2 md:order-3 mt-1 md:mt-2 flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={days}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black leading-none text-[#1A1A1A] md:text-4xl"
                >
                  {days}
                </motion.span>
              </AnimatePresence>

              <span className="text-xs font-bold uppercase tracking-wide text-[#999]">
                Days
              </span>
            </div>

            <input
              id="days-slider"
              type="range"
              min={7}
              max={21}
              step={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="order-3 md:order-2 mt-2 md:mt-2 range-slider w-full"
              style={{
                background: `linear-gradient(to right, #FF5A3D 0%, #FF5A3D ${daysPercent}%, #E5E7EB ${daysPercent}%, #E5E7EB 100%)`,
              }}
            />
          </div>

          {/* Daily Lesson Duration */}

          <div className="flex flex-col items-center md:items-start">
            <label
              htmlFor="minutes-slider"
              className="order-1 block text-[10px] font-semibold uppercase tracking-wide text-[#999]"
            >
              Daily Lesson Duration
            </label>

            <div className="order-2 md:order-3 mt-1 md:mt-2 flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={minutes}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black leading-none text-[#1A1A1A] md:text-4xl"
                >
                  {minutes}
                </motion.span>
              </AnimatePresence>

              <span className="text-xs font-bold uppercase tracking-wide text-[#999]">
                Minutes
              </span>
            </div>

            <input
              id="minutes-slider"
              type="range"
              min={15}
              max={60}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="order-3 md:order-2 mt-2 md:mt-2 range-slider w-full"
              style={{
                background: `linear-gradient(to right, #FF5A3D 0%, #FF5A3D ${minutesPercent}%, #E5E7EB ${minutesPercent}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        {/* ---------- RIGHT COLUMN — live preview ---------- */}

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-[#999]">
              Your Training Plan
            </h3>

            {/* Circular progress ring */}

            <div className="mt-2 flex flex-col items-center">
              <div className="relative h-[60px] w-[60px]">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <defs>
                    <linearGradient
                      id="ringGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#FF5A3D" />
                      <stop offset="100%" stopColor="#FF6201" />
                    </linearGradient>
                  </defs>

                  {/* Track */}

                  <circle
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#EEEEEE"
                    strokeWidth="10"
                  />

                  {/* Fill */}

                  <circle
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="url(#ringGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
                  />
                </svg>

                {/* Center label */}

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalHours.toFixed(1)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-black text-[#1A1A1A]"
                    >
                      {totalHours.toFixed(1)}
                    </motion.span>
                  </AnimatePresence>

                  <span className="text-[8px] font-bold uppercase tracking-wide text-[#999]">
                    Hours
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown rows */}

            <div className="mt-2 space-y-1">
              <Row label="Training Days" value={String(days)} />
              <Row label="Daily Duration" value={`${minutes} Minutes`} />
            </div>

            {/* Estimated price */}

            <div className="mt-2 rounded-lg px-3 py-2 text-white" style={{ background: "linear-gradient(135deg, #FF5A3D, #E94A2C)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
                Estimated Total
              </span>

              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-xs font-semibold text-white/90">Rs.</span>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={calculatedPrice}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="font-mono text-2xl font-bold leading-none"
                  >
                    {calculatedPrice.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </div>

              {savings > 0 && (
                <span className="mt-0.5 block text-[10px] font-semibold text-white/80">
                  SAVE RS. {savings.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOOK BUTTON ===== */}

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() =>
            onBook?.({
              course: "Custom Course",
              days,
              minutes,
              price: calculatedPrice,
            })
          }
          className="h-11 w-full rounded-lg border-2 border-[#FF5A3D] bg-white text-sm font-bold uppercase tracking-wide text-[#FF5A3D] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#FFF5F2] hover:shadow-md active:scale-[0.98] md:w-[75%]"
        >
          Book This Package
        </button>
      </div>

      {/* Range-input styling (scoped to this component). */}

      <style>{`
        .range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FF5A3D;
          border: 4px solid #ffffff;
          box-shadow: 0 2px 10px rgba(255, 90, 61, 0.45);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 14px rgba(255, 90, 61, 0.55);
        }
        .range-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FF5A3D;
          border: 4px solid #ffffff;
          box-shadow: 0 2px 10px rgba(255, 90, 61, 0.45);
          cursor: pointer;
        }
        .range-slider::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}

// Single breakdown row — label left, value right, compact.

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#999]">{label}</span>

      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
          className="text-xs font-bold text-[#333]"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default CustomCourseCard;
