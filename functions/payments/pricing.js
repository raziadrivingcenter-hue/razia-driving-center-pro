/* ------------------------------------------------------------------ */
/*  Server-side price recalculation.                                   */
/*                                                                    */
/*  The browser's distance and price are NEVER trusted on the payment  */
/*  path: the amount charged is derived here from the customer's        */
/*  coordinates and the server's own rate table.                       */
/*                                                                    */
/*  The rate constants come from lib/slotConfig.js so the booking path */
/*  cannot drift from the availability path. The course table mirrors  */
/*  route-charge.js (the server-side estimate endpoint) — a deliberate  */
/*  copy, because consolidating the three existing copies of this      */
/*  formula is a separate change that needs its own verification.      */
/* ------------------------------------------------------------------ */

import {
  MAX_DISTANCE_KM,
  RATE_PER_KM,
  PLUS_FREE_KM,
} from "../lib/slotConfig.js";

export const ROUND_TRIP_MULTIPLIER = 2;
export const DEFAULT_ROUTE_BASE_URL = "https://router.project-osrm.org";

// Keep in sync with BASE_LOCATION in src/lib/serviceAreaConfig.js.
export const BASE_LOCATION = { lat: 31.5201889, lng: 74.3575145 };

/** Keyed by the INTERNAL course name (matches route-charge.js). */
export const COURSE_PACKAGES = {
  "Basic Plan": { durationDays: 7, fee: 9999, planType: "basic" },
  "Economy Driving Course": { durationDays: 10, fee: 14500, planType: "plus" },
  "Pro Driver Course": { durationDays: 15, fee: 21750, planType: "pro" },
};

/**
 * The booking form stores the display title ("PLUS Plan"), while the rate
 * table is keyed by the internal name ("Economy Driving Course"). Both are
 * accepted. "Custom Course" is deliberately absent: its price is whatever
 * the customer typed, so it cannot be charged online.
 */
export const COURSE_TITLE_ALIASES = {
  "Basic Plan": "Basic Plan",
  "PLUS Plan": "Economy Driving Course",
  "Economy Driving Course": "Economy Driving Course",
  "PRO+ Plan": "Pro Driver Course",
  "Pro Driver Course": "Pro Driver Course",
};

/**
 * @param {string} title - display title or internal course name
 * @returns {{internal: string, durationDays: number, fee: number, planType: string}|null}
 */
export function resolveCourse(title) {
  const internal = COURSE_TITLE_ALIASES[String(title || "").trim()];
  if (!internal) return null;
  const pkg = COURSE_PACKAGES[internal];
  return pkg ? { internal, ...pkg } : null;
}

/** Distance fee for a VERIFIED driving distance. Same formula as route-charge. */
export function calculateDistanceFee(distanceKm, durationDays, planType) {
  const distance = Math.min(Math.max(Number(distanceKm) || 0, 0), MAX_DISTANCE_KM);
  const days = Math.max(Number(durationDays) || 0, 0);
  const freeKm = planType === "plus" ? Math.min(distance, PLUS_FREE_KM) : 0;
  const chargeableKm = distance - freeKm;

  return {
    distanceKm: distance,
    chargeableKm,
    freeKm,
    ratePerKm: RATE_PER_KM,
    durationDays: days,
    roundTripMultiplier: ROUND_TRIP_MULTIPLIER,
    distanceFee: Math.round(chargeableKm * RATE_PER_KM * days * ROUND_TRIP_MULTIPLIER),
  };
}

/**
 * Recompute the payable amount from coordinates.
 *
 * @param {{ pickup?: {lat:number, lng:number}|null, courseId?: string,
 *           routeBaseUrl?: string, fetchImpl?: Function }} args
 * @returns {Promise<{ok: boolean, error?: string, distanceKm?: number,
 *                    courseFee?: number, distanceFee?: number, totalFee?: number,
 *                    breakdown?: object, withinServiceArea?: boolean}>}
 */
export async function recalculatePrice({
  pickup = null,
  courseId = "",
  routeBaseUrl = "",
  fetchImpl = fetch,
}) {
  const course = resolveCourse(courseId);
  if (!course) {
    return {
      ok: false,
      error:
        "This course cannot be priced for online payment. Please choose a standard plan or book with Payment On Arrival.",
    };
  }

  // No pick & drop → course fee only. There is nothing to route.
  if (!pickup) {
    return {
      ok: true,
      courseFee: course.fee,
      distanceFee: 0,
      totalFee: course.fee,
      distanceKm: 0,
      withinServiceArea: true,
      breakdown: {
        ...calculateDistanceFee(0, course.durationDays, course.planType),
        hasPickDrop: false,
      },
    };
  }

  const lat = Number(pickup.lat);
  const lng = Number(pickup.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: "A valid pickup location is required for online payment." };
  }

  const base = routeBaseUrl || DEFAULT_ROUTE_BASE_URL;
  const coords = `${BASE_LOCATION.lng},${BASE_LOCATION.lat};${lng},${lat}`;

  let route;
  try {
    const upstream = await fetchImpl(
      `${base}/route/v1/driving/${coords}?overview=simplified&geometries=geojson`
    );
    if (!upstream.ok) {
      return { ok: false, error: `Routing service returned ${upstream.status}` };
    }
    const payload = await upstream.json();
    route = payload?.routes?.[0];
  } catch (error) {
    console.error("Payment pricing routing error:", error);
    return { ok: false, error: "Routing service unavailable" };
  }

  if (!route || !Number.isFinite(route.distance)) {
    return { ok: false, error: "No driving route found for those coordinates" };
  }

  const distanceKm = route.distance / 1000;
  const breakdown = calculateDistanceFee(distanceKm, course.durationDays, course.planType);
  const totalFee = course.fee + breakdown.distanceFee;

  return {
    ok: true,
    courseFee: course.fee,
    distanceFee: breakdown.distanceFee,
    totalFee,
    distanceKm,
    withinServiceArea: distanceKm <= MAX_DISTANCE_KM,
    breakdown: { ...breakdown, hasPickDrop: true },
  };
}

/**
 * Guard used by the checkout endpoint: online payment needs a distance the
 * SERVER derived. A manual distance is unverifiable, so it is refused.
 */
export function canPayOnline({ wantsPickDrop, distanceSource, pickup }) {
  if (!wantsPickDrop) return { ok: true, reason: null };
  if (distanceSource === "manual") {
    return {
      ok: false,
      reason:
        "Distance was entered manually, so we cannot verify the price online. We will confirm your booking manually instead.",
    };
  }
  if (!pickup || !Number.isFinite(Number(pickup.lat)) || !Number.isFinite(Number(pickup.lng))) {
    return {
      ok: false,
      reason:
        "A map pickup point is required for online payment. Please set your pickup on the map.",
    };
  }
  return { ok: true, reason: null };
}
