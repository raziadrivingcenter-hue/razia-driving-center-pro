/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — server-side route + charge recalculation*/
/*  Route: POST /api/v1/route-charge                                  */
/*  Body:  { "pickup": { "lat": 31.5, "lng": 74.35 },                 */
/*           "courseId": "Economy Driving Course" }                   */
/*                                                                    */
/*  Recomputes the driving distance from our base to the supplied     */
/*  coordinates with OSRM, then applies the same pick & drop formula   */
/*  the booking flow uses. The browser-displayed charge is an         */
/*  estimate only — this is the value that should be trusted.         */
/*                                                                    */
/*  TODO(sec): this endpoint is NOT called by the booking acceptance  */
/*  path yet. Enforcing it means changing the booking endpoint /      */
/*  submit_slot_booking (11-arg), which is outside the current scope. */
/*  Until that wiring lands, distance_km accepted from the client     */
/*  must still be treated as unverified.                              */
/* ------------------------------------------------------------------ */

import {
  MAX_DISTANCE_KM,
  RATE_PER_KM,
  PLUS_FREE_KM,
} from "../../lib/slotConfig";

// Keep in sync with BASE_LOCATION in src/lib/serviceAreaConfig.js.
const BASE_LOCATION = { lat: 31.5201889, lng: 74.3575145 };

const ROUND_TRIP_MULTIPLIER = 2;
const DEFAULT_ROUTE_BASE_URL = "https://router.project-osrm.org";

// Keep in sync with PICK_DROP_COURSE_CONFIG in src/lib/pickDropCalculator.js.
const COURSE_PACKAGES = {
  "Basic Plan": { durationDays: 7, fee: 9999 },
  "Economy Driving Course": { durationDays: 10, fee: 14500 },
  "Pro Driver Course": { durationDays: 15, fee: 21750 },
};

// Keep in sync with getPlanType in src/lib/pickDropCalculator.js.
function getPlanType(courseId) {
  if (courseId === "Economy Driving Course" || courseId === "PLUS Plan") return "plus";
  if (courseId === "Basic Plan") return "basic";
  if (courseId === "Pro Driver Course" || courseId === "PRO+ Plan") return "pro";
  return null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

const isFiniteNumber = (value) =>
  typeof value === "number" ? Number.isFinite(value) : Number.isFinite(Number(value));

/** Distance + charge breakdown from a verified driving distance. */
function calculateDistanceFee(distanceKm, durationDays, planType) {
  const distance = Math.min(Math.max(distanceKm, 0), MAX_DISTANCE_KM);
  const freeKm =
    planType === "plus" ? Math.min(distance, PLUS_FREE_KM) : 0;
  const chargeableKm = distance - freeKm;

  return {
    distanceKm: distance,
    chargeableKm,
    freeKm,
    ratePerKm: RATE_PER_KM,
    durationDays,
    roundTripMultiplier: ROUND_TRIP_MULTIPLIER,
    distanceFee: Math.round(
      chargeableKm * RATE_PER_KM * durationDays * ROUND_TRIP_MULTIPLIER
    ),
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const pickup = body?.pickup;
  if (
    !pickup ||
    !isFiniteNumber(pickup.lat) ||
    !isFiniteNumber(pickup.lng) ||
    Math.abs(Number(pickup.lat)) > 90 ||
    Math.abs(Number(pickup.lng)) > 180
  ) {
    return json({ error: "pickup.lat and pickup.lng must be valid coordinates" }, 400);
  }

  const courseId = COURSE_PACKAGES[body?.courseId] ? body.courseId : "Economy Driving Course";
  const packageDetails = COURSE_PACKAGES[courseId];
  const planType = getPlanType(courseId);

  const to = { lat: Number(pickup.lat), lng: Number(pickup.lng) };
  const routeBaseUrl = env.ROUTE_BASE_URL || DEFAULT_ROUTE_BASE_URL;
  const coords = `${BASE_LOCATION.lng},${BASE_LOCATION.lat};${to.lng},${to.lat}`;

  let route;
  try {
    const upstream = await fetch(
      `${routeBaseUrl}/route/v1/driving/${coords}?overview=simplified&geometries=geojson`
    );
    if (!upstream.ok) {
      return json({ error: `Routing service returned ${upstream.status}` }, 502);
    }
    const payload = await upstream.json();
    route = payload?.routes?.[0];
  } catch (error) {
    console.error("Route-charge routing error:", error);
    return json({ error: "Routing service unavailable" }, 502);
  }

  if (!route || !Number.isFinite(route.distance)) {
    return json({ error: "No driving route found for those coordinates" }, 404);
  }

  const distanceKm = route.distance / 1000;
  const breakdown = calculateDistanceFee(distanceKm, packageDetails.durationDays, planType);

  return json({
    base: BASE_LOCATION,
    pickup: to,
    distanceKm,
    durationMinutes: Number.isFinite(route.duration) ? route.duration / 60 : null,
    withinServiceArea: distanceKm <= MAX_DISTANCE_KM,
    maxDistanceKm: MAX_DISTANCE_KM,
    courseId,
    durationDays: packageDetails.durationDays,
    courseFee: packageDetails.fee,
    distanceFee: breakdown.distanceFee,
    totalFee: packageDetails.fee + breakdown.distanceFee,
    breakdown: {
      chargeableKm: breakdown.chargeableKm,
      freeKm: breakdown.freeKm,
      ratePerKm: breakdown.ratePerKm,
      roundTripMultiplier: breakdown.roundTripMultiplier,
    },
  });
}
