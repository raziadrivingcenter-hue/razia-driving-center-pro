// =============================================================================
// Pick & Drop Calculation Engine
// =============================================================================
// Pure calculation utility — no React, no JSX, no DOM, no browser APIs, no Supabase.
// Safe to reuse in booking confirmation, admin dashboard, invoices, quotations, etc.
// =============================================================================

// --- Fixed pricing configuration ----------------------------------------------

export const PICKUP_DROP_RATE_PER_KM = 50;

export const ROUND_TRIP = 2;

// Minimum address length used by the booking form's own validation.
// Kept here so the distance UI and the engine share one source of truth.
export const MIN_ADDRESS_LENGTH = 5;

// --- Course configuration -----------------------------------------------------
// Standard course durations (days) and fees (Rs.).
// Custom Course is dynamic, so its values are passed in at call time.

export const PICK_DROP_COURSE_CONFIG = {
  "Economy Driving Course": {
    durationDays: 10,
    fee: 14500,
  },
  "Pro Driver Course": {
    durationDays: 21,
    fee: 26500,
  },
  "Own Vehicle Training": {
    durationDays: 10,
    fee: 13989,
  },
};

// --- Safe numeric helpers ----------------------------------------------------

const toFiniteNumber = (value) => {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : 0;
};

const sanitizeDistance = (distanceKm) => {
  const number = toFiniteNumber(distanceKm);

  return number < 0 ? 0 : number;
};

const sanitizeDuration = (courseDuration) => {
  const number = toFiniteNumber(courseDuration);

  return number < 0 ? 0 : number;
};

// --- Course lookups ----------------------------------------------------------

export const getCourseDurationDays = (courseTitle, { customDays } = {}) => {
  if (courseTitle === "Custom Course") {
    return sanitizeDuration(customDays);
  }

  const config = PICK_DROP_COURSE_CONFIG[courseTitle];

  return config ? config.durationDays : 0;
};

export const getCourseFee = (courseTitle, { customPrice } = {}) => {
  if (courseTitle === "Custom Course") {
    return toFiniteNumber(customPrice);
  }

  const config = PICK_DROP_COURSE_CONFIG[courseTitle];

  return config ? config.fee : 0;
};

// --- Core calculation --------------------------------------------------------
// Returns a structured breakdown. Pure math only — every input is sanitized so
// the result is never NaN or Infinity, and never negative.

export const calculatePickDropCharges = ({ courseDuration, distanceKm }) => {
  const duration = sanitizeDuration(courseDuration);
  const distance = sanitizeDistance(distanceKm);

  const pickDropCharges = Math.round(
    duration * PICKUP_DROP_RATE_PER_KM * distance * ROUND_TRIP
  );

  return {
    courseDuration: duration,
    distanceKm: distance,
    ratePerKm: PICKUP_DROP_RATE_PER_KM,
    roundTrip: ROUND_TRIP,
    pickDropCharges,
  };
};

// --- Convenience: total payable ----------------------------------------------

export const calculateTotalPayable = ({ courseTitle, courseDuration, distanceKm, customPrice }) => {
  const courseFee = getCourseFee(courseTitle, { customPrice });
  const { pickDropCharges } = calculatePickDropCharges({ courseDuration, distanceKm });

  return {
    courseFee,
    pickDropCharges,
    totalPayable: courseFee + pickDropCharges,
  };
};
