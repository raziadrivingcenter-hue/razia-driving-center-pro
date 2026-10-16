import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const BASE_MINUTES = 30;
const BASE_DAYS = 10;
const BASE_PRICE = 14500;
const ORIGINAL_PRICE = 16000;

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
    <div className="mx-auto w-full rounded-xl border border-gray-200 bg-white p-5 md:p-6">

      {/* ===== HEADER ===== */}

      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FF6201]">
        Build Your Course
      </span>

      <h2 className="mt-2 text-xl font-bold leading-tight text-gray-900 md:text-2xl">
        Custom Driving Experience
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Design a plan that matches your schedule. Your price updates live.
      </p>

      {/* ===== TWO-COLUMN LAYOUT ===== */}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ---------- LEFT COLUMN — controls ---------- */}

        <div className="grid grid-cols-2 gap-5 md:grid-cols-1 md:gap-6">
          {/* Training Duration */}

          <div className="flex flex-col items-center md:items-start">
            <label
              htmlFor="days-slider"
              className="order-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              Training Duration
            </label>

            <div className="order-2 md:order-3 mt-1.5 flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={days}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black leading-none text-gray-900 md:text-4xl"
                >
                  <span className="font-dm-sans">{days}</span>
                </motion.span>
              </AnimatePresence>

              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
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
              className="order-3 md:order-2 mt-2 w-full range-slider"
              style={{
                background: `linear-gradient(to right, #FF6201 0%, #FF6201 ${daysPercent}%, #E5E7EB ${daysPercent}%, #E5E7EB 100%)`,
              }}
            />
          </div>

          {/* Daily Lesson Duration */}

          <div className="flex flex-col items-center md:items-start">
            <label
              htmlFor="minutes-slider"
              className="order-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              Daily Lesson Duration
            </label>

            <div className="order-2 md:order-3 mt-1.5 flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={minutes}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black leading-none text-gray-900 md:text-4xl"
                >
                  <span className="font-dm-sans">{minutes}</span>
                </motion.span>
              </AnimatePresence>

              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
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
              className="order-3 md:order-2 mt-2 w-full range-slider"
              style={{
                background: `linear-gradient(to right, #FF6201 0%, #FF6201 ${minutesPercent}%, #E5E7EB ${minutesPercent}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        {/* ---------- RIGHT COLUMN — live preview ---------- */}

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Your Training Plan
            </h3>

            {/* Circular progress ring */}

            <div className="mt-3 flex flex-col items-center">
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
                      <stop offset="0%" stopColor="#FF6201" />
                      <stop offset="100%" stopColor="#FF3131" />
                    </linearGradient>
                  </defs>

                  {/* Track */}

                  <circle
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#E5E7EB"
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
                      className="text-xs font-black text-gray-900"
                    >
                      <span className="font-dm-sans">{totalHours.toFixed(1)}</span>
                    </motion.span>
                  </AnimatePresence>

                  <span className="text-[8px] font-bold uppercase tracking-wide text-gray-400">
                    Hours
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown rows */}

            <div className="mt-3 space-y-1.5">
              <Row label="Training Days" value={String(days)} />
              <Row label="Daily Duration" value={`${minutes}`} unit="Minutes" />
            </div>

            {/* Estimated price */}

            <div className="mt-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Estimated Total
              </span>

              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-sm font-bold text-gray-900">Rs.</span>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={calculatedPrice}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="font-mono text-2xl font-black leading-none text-gray-900"
                  >
                    <span className="font-dm-sans">{calculatedPrice.toLocaleString()}</span>
                  </motion.span>
                </AnimatePresence>
              </div>

              {savings > 0 && (
                <span className="mt-0.5 block text-[10px] font-semibold text-[#FF6201]">
                  SAVE RS. <span className="font-dm-sans">{savings.toLocaleString()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOOK BUTTON ===== */}

      <div className="mt-6 flex justify-center">
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
          className="btn-interactive inline-flex h-11 w-full items-center justify-center rounded-md bg-gray-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-gray-800 active:scale-[0.98] md:w-[75%]"
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
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FF6201;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(255, 98, 1, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .range-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FF6201;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(255, 98, 1, 0.35);
          cursor: pointer;
        }
        .range-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}

// Single breakdown row — label left, value right, compact.

function Row({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>

      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
          className="text-xs font-bold text-gray-700"
        >
          <span className="font-dm-sans">{value}</span>
          {unit && ` ${unit}`}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default CustomCourseCard;
