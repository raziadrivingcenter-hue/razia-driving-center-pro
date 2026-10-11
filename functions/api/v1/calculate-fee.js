/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Calculate driving course fee
/*  Route: /api/v1/calculate-fee
/*  Pure computation — no database access needed.
/*  Formula: distance_km * 50 * total_days * 2
/*  PLUS Plan: first 2 km are free.
/* ------------------------------------------------------------------ */

const RATE_PER_KM = 50;
const ROUND_TRIP_MULTIPLIER = 2;
const MAX_DISTANCE_KM = 20;
const PLUS_FREE_KM = 2;

const COURSE_PACKAGES = {
  basic: { name: "Basic Plan", durationDays: 7, fee: 9999 },
  plus: { name: "PLUS Plan", durationDays: 10, fee: 14500 },
  pro: { name: "PRO+ Plan", durationDays: 15, fee: 21750 },
};

function sanitizeNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function calculateDistanceFee(distanceKm, totalDays, planType) {
  const rawDistance = sanitizeNumber(distanceKm);
  const distance = Math.min(rawDistance, MAX_DISTANCE_KM);
  const days = sanitizeNumber(totalDays);

  // PLUS Plan gets first 2 km free
  const chargeableKm =
    planType === "plus" && distance > PLUS_FREE_KM
      ? distance - PLUS_FREE_KM
      : planType === "plus"
        ? 0
        : distance;

  const distanceFee = Math.round(
    chargeableKm * RATE_PER_KM * days * ROUND_TRIP_MULTIPLIER
  );

  return {
    distanceKm: distance,
    chargeableKm,
    freeKm: planType === "plus" ? Math.min(distance, PLUS_FREE_KM) : 0,
    ratePerKm: RATE_PER_KM,
    days,
    roundTripMultiplier: ROUND_TRIP_MULTIPLIER,
    distanceFee,
  };
}

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();

    // Support both plan_type slug and explicit values
    const planType = (body.plan_type || body.planType || "").toLowerCase();

    // Determine course fee and duration
    let courseFee;
    let totalDays;

    if (COURSE_PACKAGES[planType]) {
      courseFee = COURSE_PACKAGES[planType].fee;
      totalDays = COURSE_PACKAGES[planType].durationDays;
    } else if (body.course_fee != null && body.total_days != null) {
      // Custom pricing
      courseFee = sanitizeNumber(body.course_fee);
      totalDays = sanitizeNumber(body.total_days);
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid plan_type or missing course_fee/total_days",
          validPlans: Object.keys(COURSE_PACKAGES),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const distanceKm = body.distance_km != null ? Number(body.distance_km) : 0;
    const hasPickDrop = body.has_pick_drop !== false && distanceKm > 0;

    const distanceBreakdown = hasPickDrop
      ? calculateDistanceFee(distanceKm, totalDays, planType)
      : {
          distanceKm: 0,
          chargeableKm: 0,
          freeKm: 0,
          ratePerKm: RATE_PER_KM,
          days: totalDays,
          roundTripMultiplier: ROUND_TRIP_MULTIPLIER,
          distanceFee: 0,
        };

    const totalFee = courseFee + distanceBreakdown.distanceFee;

    return new Response(
      JSON.stringify({
        plan: COURSE_PACKAGES[planType]?.name || "Custom",
        planType,
        courseFee,
        distanceFee: distanceBreakdown.distanceFee,
        totalFee,
        breakdown: {
          ...distanceBreakdown,
          hasPickDrop,
          plusFreeKmApplied: planType === "plus" && distanceKm > 0,
        },
        formula: hasPickDrop
          ? planType === "plus"
            ? `(${distanceBreakdown.distanceKm} km - 2 km free) × ${RATE_PER_KM} × ${totalDays} days × ${ROUND_TRIP_MULTIPLIER} = ${distanceBreakdown.distanceFee}`
            : `${distanceBreakdown.distanceKm} km × ${RATE_PER_KM} × ${totalDays} days × ${ROUND_TRIP_MULTIPLIER} = ${distanceBreakdown.distanceFee}`
          : "No pick & drop charges",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Calculate-fee function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
