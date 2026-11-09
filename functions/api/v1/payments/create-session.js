/* ------------------------------------------------------------------ */
/*  POST /api/v1/payments/create-session                               */
/*                                                                    */
/*  Starts an online card checkout. Creates the booking as             */
/*  'pending_payment' with a 15-minute slot hold, then hands the        */
/*  customer to the gateway's hosted page.                              */
/*                                                                    */
/*  The amount is recalculated HERE from coordinates. Whatever the      */
/*  browser sent as distance or price is ignored. A booking whose       */
/*  distance was typed by hand cannot be priced, so it is refused and    */
/*  the caller falls back to the normal manual-confirmation path.       */
/*                                                                    */
/*  This endpoint NEVER confirms a booking. Only the webhook does.      */
/* ------------------------------------------------------------------ */

import { validateSlotTime } from "../../../lib/slotConfig.js";
import { checkSlotAvailability } from "../../../lib/slotAvailabilityCheck.js";
import { verifyDashboardToken } from "../../../lib/verifyDashboardToken.js";
import { getServiceRoleClient } from "../../../lib/supabaseRest.js";
import { recalculatePrice, canPayOnline } from "../../../payments/pricing.js";
import { getProvider, isMockPermitted } from "../../../payments/provider.js";
import { holdExpiryDate, HOLD_MINUTES } from "../../../payments/hold.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });

const REQUIRED = [
  ["customer_name", "Name is required"],
  ["customer_phone", "Phone number is required"],
];

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Feature flag. Off → the card option is not offered at all.
  if (String(env.PAYMENTS_CARD_ENABLED || "") !== "true") {
    return json(
      { error: "Card payments are not available yet.", code: "CARD_PAYMENTS_DISABLED" },
      404
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // ── Validate ───────────────────────────────────────────────────────
  const errors = [];
  for (const [field, message] of REQUIRED) {
    if (!body[field] || !String(body[field]).trim()) errors.push(message);
  }
  if (!body.preferred_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.preferred_date)) {
    errors.push("Valid date is required (YYYY-MM-DD)");
  }
  if (!body.preferred_time) {
    errors.push("Preferred time is required");
  } else {
    const timeCheck = validateSlotTime(body.preferred_time);
    if (!timeCheck.ok) errors.push(`Preferred time: ${timeCheck.error}`);
  }

  const wantsPickDrop = body.home_service === true;
  if (wantsPickDrop) {
    if (!body.address || !String(body.address).trim()) {
      errors.push("Pickup address is required for Pick & Drop");
    }
  }
  if (errors.length > 0) {
    return json({ error: "Validation failed", details: errors }, 400);
  }

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json({ error: "Booking service not configured" }, 500);
  }

  // ── Identity (dashboard bookings only) ─────────────────────────────
  const identity = await verifyDashboardToken({
    supabaseUrl,
    anonKey,
    request,
  });
  if (!identity.ok) {
    return json({ error: identity.error }, identity.status);
  }

  // ── Provider guard ─────────────────────────────────────────────────
  // The mock adapter is a local-development tool. getProvider() also refuses
  // it, but this check runs first so a deployed site gets a precise answer
  // instead of a generic provider failure.
  if (
    String(env.PAYMENT_PROVIDER || "mock").toLowerCase() === "mock" &&
    !isMockPermitted(env)
  ) {
    console.error(
      "Refusing checkout: the mock provider is not permitted in this environment"
    );
    return json(
      { error: "Card payments are not available yet.", code: "PROVIDER_NOT_PERMITTED" },
      503
    );
  }

  let provider;
  try {
    provider = await getProvider(env);
  } catch (error) {
    console.error("Payment provider error:", error?.message || error);
    return json({ error: "Card payments are not available yet." }, 503);
  }
  if (!provider.verified) {
    // Never start a checkout on an integration that has not been checked
    // against the gateway's documentation.
    console.error(`Refusing checkout: provider "${provider.id}" is not verified`);
    return json(
      { error: "Card payments are not available yet.", code: "PROVIDER_NOT_VERIFIED" },
      503
    );
  }

  // ── How was the distance obtained? ─────────────────────────────────
  const distanceSource = body.distance_source === "manual" ? "manual" : "map";
  const pickup =
    wantsPickDrop && Number.isFinite(Number(body.pickup?.lat)) && Number.isFinite(Number(body.pickup?.lng))
      ? { lat: Number(body.pickup.lat), lng: Number(body.pickup.lng) }
      : null;

  const online = canPayOnline({ wantsPickDrop, distanceSource, pickup });
  if (!online.ok) {
    return json(
      {
        error: online.reason,
        code: "MANUAL_DISTANCE_NOT_PAYABLE_ONLINE",
        // The UI uses this to fall back to the manual-confirmation endpoint.
        fallback: "manual_confirmation",
      },
      409
    );
  }

  // ── Price: recalculated server-side, never from the browser ────────
  const price = await recalculatePrice({
    pickup,
    courseId: body.course,
    routeBaseUrl: env.ROUTE_BASE_URL || "",
    fetchImpl: fetch,
  });
  if (!price.ok) {
    return json({ error: price.error, code: "PRICE_UNAVAILABLE" }, 400);
  }
  if (wantsPickDrop && price.withinServiceArea === false) {
    return json(
      {
        error: "The driving route is over 20 KM — pick & drop is not available here.",
        code: "OUT_OF_SERVICE_AREA",
      },
      400
    );
  }

  // ── Slot availability (same gate as the booking endpoint) ──────────
  const availability = await checkSlotAvailability({
    fetchImpl: fetch,
    supabaseUrl,
    anonKey,
    date: body.preferred_date,
    time: body.preferred_time,
    area: body.area ? String(body.area).trim() : "",
  });
  if (!availability.ok) {
    return json({ error: availability.error }, availability.status);
  }

  // ── Persist: booking + hold, atomically, service role only ─────────
  const client = getServiceRoleClient(env);
  if (!client) {
    console.error("Card checkout rejected: SUPABASE_SERVICE_ROLE_KEY not configured");
    return json(
      { error: "Card payments are not configured. Please try again later." },
      503
    );
  }

  const rpcPayload = {
    p_customer_name: String(body.customer_name).trim(),
    p_customer_phone: String(body.customer_phone).trim(),
    p_preferred_date: body.preferred_date,
    p_preferred_time: body.preferred_time,
    p_preferred_course: body.course ? String(body.course).trim() : null,
    p_distance_km: wantsPickDrop ? price.distanceKm : 0,
    p_home_service: wantsPickDrop,
    p_address: wantsPickDrop && body.address ? String(body.address).trim() : null,
    p_area: body.area ? String(body.area).trim() : null,
    p_vehicle_id: availability.vehicleId ?? 0,
    p_distance_source: wantsPickDrop ? distanceSource : "none",
    p_course_fee: price.courseFee,
    p_distance_fee: price.distanceFee,
    p_total_fee: price.totalFee,
    p_customer_email: identity.email,
    p_hold_minutes: HOLD_MINUTES,
  };

  let bookingId;
  try {
    bookingId = await client.rpc("create_card_booking", rpcPayload);
  } catch (error) {
    if (error.status === 409) {
      return json(
        {
          error:
            "Another customer is paying for this slot right now. Please pick another time.",
          code: "SLOT_HELD",
        },
        409
      );
    }
    const missingFunction =
      error.status === 404 ||
      /PGRST202|could not find the function/i.test(String(error.body || error.message));
    if (missingFunction) {
      return json(
        {
          error:
            "Online payment requires a website upgrade. Please book with Payment On Arrival.",
          code: "RPC_MISSING",
        },
        503
      );
    }
    console.error("create_card_booking failed:", error?.message || error);
    return json({ error: "Could not start the checkout. Please try again." }, 503);
  }

  const origin = new URL(request.url).origin;
  const returnParams = (result) =>
    `?result=${result}&booking=${encodeURIComponent(bookingId)}`;

  // ── Hand off to the gateway's hosted page ──────────────────────────
  let session;
  try {
    session = await provider.createCheckoutSession({
      checkoutUrlBase: origin,
      bookingId,
      amount: price.totalFee,
      currency: "PKR",
      customer: {
        name: String(body.customer_name).trim(),
        phone: String(body.customer_phone).trim(),
      },
      successUrl: `${origin}/api/v1/payments/return${returnParams("success")}`,
      cancelUrl: `${origin}/api/v1/payments/return${returnParams("cancel")}`,
      webhookUrl: `${origin}/api/v1/payments/webhook`,
      env,
    });
  } catch (error) {
    console.error("Provider createCheckoutSession failed:", error?.message || error);
    return json(
      { error: "Card payments are not available yet.", code: "CHECKOUT_FAILED" },
      503
    );
  }

  // Record the reference so the status endpoint can be reached without
  // trusting a caller-supplied booking id alone.
  try {
    await client.patch(`booking_requests?id=eq.${encodeURIComponent(bookingId)}`, {
      checkout_reference: session.providerReference || bookingId,
      payment_method: "debit_card",
    });
  } catch (error) {
    // Non-fatal: the hold and booking exist, the gateway has the m_payment_id.
    console.error("Failed to store checkout reference:", error?.message || error);
  }

  return json(
    {
      success: true,
      bookingId,
      status: "pending_payment",
      amount: price.totalFee,
      currency: "PKR",
      checkoutUrl: session.url,
      holdExpiresAt: holdExpiryDate().toISOString(),
      // The UI shows this while the gateway page is loading.
      message: "Redirecting you to the payment page…",
    },
    201
  );
}
