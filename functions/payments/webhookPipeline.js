/* ------------------------------------------------------------------ */
/*  Webhook pipeline — provider-independent.                           */
/*                                                                    */
/*  Order of operations matters:                                       */
/*   1. verify the signature over the RAW body                         */
/*   2. claim the event id (idempotency) BEFORE any state change       */
/*   3. load the booking and re-check its state                        */
/*   4. only then transition                                           */
/*                                                                    */
/*  A duplicate delivery is answered 200 with `duplicated: true` so the  */
/*  gateway stops retrying, and it never re-applies a transition.       */
/*                                                                    */
/*  Nothing in this file reads a payment status from a query string or  */
/*  a redirect URL. The success/cancel pages only ever poll the status  */
/*  endpoint, which reads the booking row the webhook wrote.           */
/* ------------------------------------------------------------------ */

import {
  BOOKING_PAYMENT_STATUS,
  HOLD_STATUS,
  WEBHOOK_STATUS_MAP,
} from "./hold.js";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

/** Gateway amounts must already be in the same unit as booking.total_fee. */
function amountMatches(gatewayAmount, bookingAmount) {
  if (gatewayAmount == null) return true; // adapter did not supply one
  const a = Number(gatewayAmount);
  const b = Number(bookingAmount);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  // Gateway decimal strings can carry .00 / .0 noise; compare to the paisa.
  return Math.abs(a - b) < 0.005;
}

/**
 * @param {{ provider: object, rawBody: string, headers: Headers,
 *           env: object, client: object, fetchImpl?: Function,
 *           now?: Date, log?: Function }} args
 * @returns {Promise<Response>}
 */
export async function handleWebhook({
  provider,
  rawBody,
  headers,
  env,
  client,
  now = new Date(),
  log = console.error,
}) {
  if (!client) {
    log("Webhook rejected: service role not configured");
    return jsonResponse({ ok: false, error: "service_unavailable" }, 503);
  }

  // 1. Signature over the exact bytes. Never parse first.
  let verdict;
  try {
    verdict = await provider.verifyWebhook({ rawBody, headers, env });
  } catch (error) {
    // An unverified adapter throws here. Answer 500 so the gateway retries
    // rather than silently dropping a real payment notification.
    log("Webhook verification threw:", error?.message || error);
    return jsonResponse({ ok: false, error: "verification_error" }, 500);
  }

  if (!verdict?.ok) {
    log("Webhook rejected by provider:", verdict?.reason);
    return jsonResponse({ ok: false, error: "invalid_signature" }, 401);
  }

  if (!verdict.eventId) {
    log("Webhook rejected: provider returned no event id");
    return jsonResponse({ ok: false, error: "missing_event_id" }, 400);
  }

  // 2. Claim the event. ignore-duplicates + return=representation yields an
  //    empty array for a repeat, which is our idempotency signal.
  let claimed;
  try {
    claimed = await client.post(
      "payment_events",
      {
        event_id: verdict.eventId,
        provider: provider.id,
        booking_ref: verdict.bookingRef || null,
        status: verdict.status,
        provider_reference: verdict.providerReference || null,
        amount: verdict.amount != null ? Number(verdict.amount) : null,
        currency: verdict.currency || null,
        raw: safeParse(rawBody),
      },
      "resolution=ignore-duplicates,return=representation"
    );
  } catch (error) {
    log("Failed to record payment event:", error?.message || error);
    return jsonResponse({ ok: false, error: "storage_error" }, 500);
  }

  if (!Array.isArray(claimed) || claimed.length === 0) {
    // Already processed. Ack and stop — this is what makes a retried webhook
    // harmless.
    return jsonResponse({ ok: true, duplicated: true });
  }

  // 3. Load the booking. The gateway's booking ref is the only link we trust.
  const bookingRef = String(verdict.bookingRef || "");
  let booking = null;
  try {
    const rows = await client.get(
      `booking_requests?id=eq.${encodeURIComponent(bookingRef)}` +
        `&select=id,status,total_fee,course_fee,distance_fee,hold_expires_at`
    );
    booking = Array.isArray(rows) ? rows[0] : null;
  } catch (error) {
    log("Failed to load booking for webhook:", error?.message || error);
    return jsonResponse({ ok: false, error: "storage_error" }, 500);
  }

  if (!booking) {
    // Event is recorded, so a retry will not re-scan. Staff can reconcile
    // from payment_events. Answer 200 to stop gateway retries.
    log(`Webhook for unknown booking ref: ${bookingRef}`);
    return jsonResponse({ ok: true, confirmed: false, reason: "unknown_booking" });
  }

  // 4. Re-check state. A booking already moved on must not be moved again.
  if (booking.status !== BOOKING_PAYMENT_STATUS.PENDING_PAYMENT) {
    return jsonResponse({ ok: true, confirmed: false, reason: "already_settled" });
  }

  const target = WEBHOOK_STATUS_MAP[verdict.status];
  if (!target) {
    return jsonResponse({ ok: true, confirmed: false, reason: "ignored_status" });
  }

  // 5. Amount guard. A payment that does not match the server-calculated
  //    total is never auto-confirmed — it needs a human.
  if (target === BOOKING_PAYMENT_STATUS.PAID && !amountMatches(verdict.amount, booking.total_fee)) {
    log(
      `Amount mismatch for booking ${bookingRef}: gateway ${verdict.amount}, ` +
        `expected ${booking.total_fee}. Not confirming.`
    );
    return jsonResponse({ ok: true, confirmed: false, reason: "amount_mismatch" });
  }

  const updates = {
    status: target,
    payment_transaction_id: verdict.providerReference || booking.payment_transaction_id || null,
    payment_verified_at: now.toISOString(),
  };
  if (target === BOOKING_PAYMENT_STATUS.PAID) {
    updates.amount_charged = verdict.amount != null ? Number(verdict.amount) : booking.total_fee;
  }

  try {
    await client.patch(`booking_requests?id=eq.${encodeURIComponent(bookingRef)}`, updates);
  } catch (error) {
    log("Failed to update booking for webhook:", error?.message || error);
    return jsonResponse({ ok: false, error: "storage_error" }, 500);
  }

  // 6. Move the slot hold to match.
  const holdUpdate =
    target === BOOKING_PAYMENT_STATUS.PAID
      ? { status: HOLD_STATUS.CONFIRMED, confirmed_at: now.toISOString() }
      : { status: HOLD_STATUS.RELEASED, released_at: now.toISOString() };

  try {
    await client.patch(
      `booking_slot_holds?booking_id=eq.${encodeURIComponent(bookingRef)}` +
        `&status=eq.${HOLD_STATUS.PENDING}`,
      holdUpdate
    );
  } catch (error) {
    // The booking is already settled; a failed hold update is a cleanup task,
    // not a reason to return an error the gateway would retry.
    log("Failed to update slot hold:", error?.message || error);
  }

  return jsonResponse({ ok: true, confirmed: true, status: target });
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw: String(raw || "").slice(0, 4000) };
  }
}
