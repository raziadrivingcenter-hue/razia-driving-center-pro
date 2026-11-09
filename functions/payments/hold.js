/* ------------------------------------------------------------------ */
/*  Slot-hold lifecycle — pure logic, no database access.              */
/*                                                                    */
/*  A hold is a temporary claim on a slot while the customer pays. It  */
/*  lives in its OWN table (booking_slot_holds), never in              */
/*  slot_availability: that table is synced from the SOD desktop app   */
/*  and writing to it would be overwritten on the next sync.           */
/* ------------------------------------------------------------------ */

/** How long a card checkout may keep a slot before it is released. */
export const HOLD_MINUTES = 15;

/**
 * Hold statuses.
 *   pending    → created, awaiting payment
 *   confirmed  → payment verified by webhook; slot is now booked
 *   expired    → hold elapsed with no payment
 *   released   → customer cancelled, or the booking was cancelled
 */
export const HOLD_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  EXPIRED: "expired",
  RELEASED: "released",
});

/** Booking statuses used on the online-payment path. */
export const BOOKING_PAYMENT_STATUS = Object.freeze({
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_CANCELLED: "payment_cancelled",
  EXPIRED: "expired",
});

/** Gateway event → booking status. Anything not listed is ignored. */
export const WEBHOOK_STATUS_MAP = Object.freeze({
  paid: BOOKING_PAYMENT_STATUS.PAID,
  completed: BOOKING_PAYMENT_STATUS.PAID,
  success: BOOKING_PAYMENT_STATUS.PAID,
  failed: BOOKING_PAYMENT_STATUS.PAYMENT_FAILED,
  failure: BOOKING_PAYMENT_STATUS.PAYMENT_FAILED,
  cancelled: BOOKING_PAYMENT_STATUS.PAYMENT_CANCELLED,
  canceled: BOOKING_PAYMENT_STATUS.PAYMENT_CANCELLED,
});

export function holdExpiryDate(now = new Date(), minutes = HOLD_MINUTES) {
  return new Date(now.getTime() + minutes * 60_000);
}

/**
 * A hold blocks its slot only while it is pending AND still inside its
 * window. Reading this purely (no I/O) is what lets the availability check
 * treat stale holds as already released.
 *
 * @param {{status?: string, expires_at?: string|Date}} hold
 * @param {Date} now
 */
export function isHoldActive(hold, now = new Date()) {
  if (!hold || hold.status !== HOLD_STATUS.PENDING) return false;
  const expiresAt = hold.expires_at ? new Date(hold.expires_at).getTime() : NaN;
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > now.getTime();
}

/** True when a booking is still inside its payment window. */
export function isPaymentPending(booking, now = new Date()) {
  if (!booking || booking.status !== BOOKING_PAYMENT_STATUS.PENDING_PAYMENT) {
    return false;
  }
  const expiresAt = booking.hold_expires_at
    ? new Date(booking.hold_expires_at).getTime()
    : NaN;
  // No hold record means we cannot prove a window — treat it as still pending
  // rather than silently releasing a booking we know nothing about.
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt > now.getTime();
}
