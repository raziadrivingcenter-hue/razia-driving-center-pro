/* ------------------------------------------------------------------ */
/*  GET /api/v1/payments/status?booking=<uuid>                         */
/*                                                                    */
/*  Read-only. The success/cancel page polls this. It never confirms   */
/*  anything — it only reports what the webhook already wrote.          */
/*                                                                    */
/*  The booking id is an unguessable UUID, which is the capability:      */
/*  anyone holding it can read this booking's payment state. It carries  */
/*  no name, phone, or address.                                         */
/* ------------------------------------------------------------------ */

import { getServiceRoleClient } from "../../../lib/supabaseRest.js";
import {
  BOOKING_PAYMENT_STATUS,
  HOLD_STATUS,
  isHoldActive,
} from "../../../payments/hold.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const bookingId = new URL(request.url).searchParams.get("booking") || "";
  if (!UUID_RE.test(bookingId)) {
    return json({ error: "A valid booking id is required" }, 400);
  }

  const client = getServiceRoleClient(env);
  if (!client) return json({ error: "Service unavailable" }, 503);

  let booking = null;
  let hold = null;
  try {
    const [bookings, holds] = await Promise.all([
      client.get(
        `booking_requests?id=eq.${encodeURIComponent(bookingId)}` +
          `&select=id,status,total_fee,amount_charged,payment_transaction_id,created_at`
      ),
      client.get(
        `booking_slot_holds?booking_id=eq.${encodeURIComponent(bookingId)}` +
          `&select=status,expires_at,confirmed_at,released_at`
      ),
    ]);
    booking = Array.isArray(bookings) ? bookings[0] : null;
    hold = Array.isArray(holds) ? holds[0] : null;
  } catch (error) {
    console.error("Payment status lookup failed:", error?.message || error);
    return json({ error: "Service unavailable" }, 503);
  }

  if (!booking) return json({ error: "Booking not found" }, 404);

  // Lazy expiry: a hold that has elapsed is reported as expired and the rows
  // are brought in line, so expiry works even before the scheduled sweep.
  if (
    booking.status === BOOKING_PAYMENT_STATUS.PENDING_PAYMENT &&
    hold &&
    !isHoldActive(hold)
  ) {
    try {
      await Promise.all([
        client.patch(`booking_requests?id=eq.${encodeURIComponent(bookingId)}`, {
          status: BOOKING_PAYMENT_STATUS.EXPIRED,
        }),
        client.patch(
          `booking_slot_holds?booking_id=eq.${encodeURIComponent(bookingId)}` +
            `&status=eq.${HOLD_STATUS.PENDING}`,
          { status: HOLD_STATUS.EXPIRED, released_at: new Date().toISOString() }
        ),
      ]);
      booking.status = BOOKING_PAYMENT_STATUS.EXPIRED;
    } catch (error) {
      console.error("Lazy expiry update failed:", error?.message || error);
    }
  }

  return json({
    bookingId,
    status: booking.status,
    paid: booking.status === BOOKING_PAYMENT_STATUS.PAID,
    amount: booking.amount_charged != null ? booking.amount_charged : booking.total_fee,
    currency: "PKR",
    transactionId: booking.payment_transaction_id || null,
    holdExpiresAt: hold?.expires_at || null,
  });
}
