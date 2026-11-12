// =============================================================================
// Own-Vehicle Course Pricing Engine — Cloudflare Functions mirror
// =============================================================================
// EXACT copy of src/lib/ownVehiclePricing.js. The Cloudflare Pages Function
// (functions/api/v1/slot-booking.js) cannot reliably import across the project
// root, so the server carries its own copy. scripts/test-booking-handlers.mjs
// proves the two modules produce identical results over a grid of inputs — if
// one is edited, that test fails.
//
// Pure calculation utility — no React, no JSX, no DOM, no browser APIs.
// =============================================================================

// --- Course configuration ---------------------------------------------------

export const MIN_DAYS = 7;
export const MAX_DAYS = 30;
export const DAYS_STEP = 1;

export const MIN_MINUTES = 30;
export const MAX_MINUTES = 60;
export const MINUTES_STEP = 10;

// 60 minutes is the reference lesson length; a 60-minute day costs
// BASE_PRICE_PER_DAY. Shorter days are proportional, longer days are not
// offered by this builder.
export const BASE_MINUTES = 60;
export const BASE_PRICE_PER_DAY = 1600;

// Fees are quoted in whole tens (Rs. 1,070 — never Rs. 1,066.67).
export const ROUND_TO = 10;

// --- Pick & drop configuration ----------------------------------------------

export const PICKDROP_RATE_PER_KM = 65;
export const MAX_DISTANCE_KM = 20;

// Every training day needs a pickup AND a drop-off, so the distance is doubled.
export const ROUND_TRIP_MULTIPLIER = 2;

// --- Safe numeric helpers ---------------------------------------------------

const toFiniteNumber = (value) => {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : 0;
};

// Round a value to the nearest increment (Rs. 1,066.67 → Rs. 1,070).
export function roundTo(value, increment = ROUND_TO) {
  const number = toFiniteNumber(value);
  const step = toFiniteNumber(increment) || ROUND_TO;

  return Math.round(number / step) * step;
}

// --- Course pricing ---------------------------------------------------------

// Price of ONE training day for a given daily lesson length.
export function perDayPrice(minutes) {
  return roundTo(
    (BASE_PRICE_PER_DAY * toFiniteNumber(minutes)) / BASE_MINUTES,
    ROUND_TO
  );
}

// Course fee for the whole course.
export function courseFee(days, minutes) {
  return toFiniteNumber(days) * perDayPrice(minutes);
}

// Total training hours — days × daily minutes, expressed in hours.
export function totalHours(days, minutes) {
  return (toFiniteNumber(days) * toFiniteNumber(minutes)) / BASE_MINUTES;
}

// --- Pick & drop ------------------------------------------------------------

// Clamp a distance to the serviceable range (0..MAX_DISTANCE_KM).
export function clampDistanceKm(km) {
  const value = toFiniteNumber(km);

  if (value < 0) return 0;
  return value > MAX_DISTANCE_KM ? MAX_DISTANCE_KM : value;
}

// Pick & drop charge: every training day is a round trip (×2).
export function pickDropCharge(days, km) {
  const distance = clampDistanceKm(km);

  return toFiniteNumber(days) * PICKDROP_RATE_PER_KM * distance * ROUND_TRIP_MULTIPLIER;
}

// --- Total ------------------------------------------------------------------

// Grand total for a course. `homeService` toggles the pick & drop charge.
export function total(days, minutes, km, homeService) {
  return courseFee(days, minutes) + (homeService ? pickDropCharge(days, km) : 0);
}

// --- Clamping / snapping ----------------------------------------------------

// Snap to the day step, then keep inside the allowed range.
export function clampDays(days) {
  const value = toFiniteNumber(days);
  const snapped = Math.round(value / DAYS_STEP) * DAYS_STEP;

  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, snapped));
}

// Snap to the minute step (nearest 10), then keep inside the allowed range.
export function clampMinutes(minutes) {
  const value = toFiniteNumber(minutes);
  const snapped = Math.round(value / MINUTES_STEP) * MINUTES_STEP;

  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, snapped));
}

// --- Validation -------------------------------------------------------------

// Accepts either an object ({ days, minutes, distanceKm, homeService }) or the
// positional arguments (days, minutes, distanceKm, homeService). Returns an
// object of field → message; empty when every value is valid.
export function validate(arg1, arg2, arg3, arg4) {
  const values =
    arg1 !== null && typeof arg1 === "object"
      ? arg1
      : { days: arg1, minutes: arg2, distanceKm: arg3, homeService: arg4 };

  const { days, minutes, distanceKm, homeService } = values;
  const errors = {};

  const dayValue = Number(days);

  if (!Number.isFinite(dayValue)) {
    errors.days = "Enter the course duration in days.";
  } else if (dayValue < MIN_DAYS) {
    errors.days = `Course duration must be at least ${MIN_DAYS} days.`;
  } else if (dayValue > MAX_DAYS) {
    errors.days = `Course duration cannot exceed ${MAX_DAYS} days.`;
  }

  const minuteValue = Number(minutes);

  if (!Number.isFinite(minuteValue)) {
    errors.minutes = "Enter the daily lesson duration in minutes.";
  } else if (minuteValue < MIN_MINUTES) {
    errors.minutes = `Daily lesson duration must be at least ${MIN_MINUTES} minutes.`;
  } else if (minuteValue > MAX_MINUTES) {
    errors.minutes = `Daily lesson duration cannot exceed ${MAX_MINUTES} minutes.`;
  }

  if (homeService) {
    const kmValue = Number(distanceKm);

    if (!Number.isFinite(kmValue) || kmValue <= 0) {
      errors.distanceKm = "Enter the distance from the training center.";
    } else if (kmValue > MAX_DISTANCE_KM) {
      errors.distanceKm = `Pick & drop is available up to ${MAX_DISTANCE_KM} km.`;
    }
  }

  return errors;
}

// --- Formatting -------------------------------------------------------------

// "16000" → "Rs. 16,000"
export function formatRs(amount) {
  return `Rs. ${Math.round(toFiniteNumber(amount)).toLocaleString("en-US")}`;
}
