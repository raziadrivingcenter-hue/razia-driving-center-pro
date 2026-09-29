// =============================================================================
// Pick & Drop Calculation Engine
// =============================================================================
// Pure calculation utility — no React, no JSX, no DOM, no browser APIs, no Supabase.
// Safe to reuse in booking confirmation, admin dashboard, invoices, quotations, etc.
// =============================================================================

// --- Fixed pricing configuration ----------------------------------------------

// Cost per kilometer for Pick & Drop service.
export const RATE_PER_KM = 50;

// Every training day requires a round trip (pickup + drop-off).
export const ROUND_TRIP_MULTIPLIER = 2;

// Pick & Drop service is only available up to this distance.
export const MAX_DISTANCE_KM = 30;

// Minimum address length used by the booking form's own validation.
// Kept here so the distance UI and the engine share one source of truth.
export const MIN_ADDRESS_LENGTH = 5;

// --- Course configuration -----------------------------------------------------
// Standard course durations (days) and fees (Rs.).
// Custom Course is dynamic, so its values are passed in at call time.

export const PICK_DROP_COURSE_CONFIG = {
  "Basic Plan": {
    durationDays: 7,
    fee: 9999,
  },
  "Economy Driving Course": {
    durationDays: 10,
    fee: 14500,
  },
  "Pro Driver Course": {
    durationDays: 15,
    fee: 21750,
  },
};

// --- Safe numeric helpers ----------------------------------------------------

const toFiniteNumber = (value) => {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : 0;
};

const sanitizeDistance = (distanceKm) => {
  const number = toFiniteNumber(distanceKm);

  if (number < 0) return 0;

  // Clamp to the maximum serviceable distance.
  return number > MAX_DISTANCE_KM ? MAX_DISTANCE_KM : number;
};

const sanitizeDuration = (durationDays) => {
  const number = toFiniteNumber(durationDays);

  return number < 0 ? 0 : number;
};

// --- Course lookups ----------------------------------------------------------

export const getCourseDurationDays = (courseId, { customDays } = {}) => {
  if (courseId === "Custom Course") {
    return sanitizeDuration(customDays);
  }

  const config = PICK_DROP_COURSE_CONFIG[courseId];

  return config ? config.durationDays : 0;
};

export const getCourseFee = (courseId, { customPrice } = {}) => {
  if (courseId === "Custom Course") {
    return toFiniteNumber(customPrice);
  }

  const config = PICK_DROP_COURSE_CONFIG[courseId];

  return config ? config.fee : 0;
};

// --- Core calculation --------------------------------------------------------
// Total Pick & Drop Cost = Distance × Rs. 50 × Duration (days) × 2 (round trip)
// Returns a structured breakdown. Pure math only — every input is sanitized so
// the result is never NaN or Infinity, and never negative.

export const calculatePickDropCharges = (distanceKm, durationDays) => {
  const distance = sanitizeDistance(distanceKm);
  const duration = sanitizeDuration(durationDays);

  const pickDropCharges = Math.round(
    distance * RATE_PER_KM * duration * ROUND_TRIP_MULTIPLIER
  );

  return {
    distanceKm: distance,
    durationDays: duration,
    ratePerKm: RATE_PER_KM,
    roundTripMultiplier: ROUND_TRIP_MULTIPLIER,
    maxDistanceKm: MAX_DISTANCE_KM,
    pickDropCharges,
  };
};

// --- Convenience: total payable ----------------------------------------------
// When the customer does not require Pick & Drop, charges are zero.

export const calculateTotalPayable = (
  courseId,
  distanceKm,
  hasPickDrop,
  { customPrice, customDays } = {}
) => {
  const courseFee = getCourseFee(courseId, { customPrice });
  const durationDays = getCourseDurationDays(courseId, { customDays });

  const { pickDropCharges } = hasPickDrop
    ? calculatePickDropCharges(distanceKm, durationDays)
    : { pickDropCharges: 0 };

  return {
    courseFee,
    pickDropCharges,
    totalPayable: courseFee + pickDropCharges,
  };
};
