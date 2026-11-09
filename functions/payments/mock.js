/* ------------------------------------------------------------------ */
/*  Mock provider — local testing only.                                */
/*                                                                    */
/*  Implements the full adapter contract with no network access:       */
/*   • createCheckoutSession returns a URL to the mock checkout page    */
/*     (/api/v1/payments/mock-checkout), which renders Pay / Cancel.   */
/*   • that page POSTs back to the webhook with a properly signed body, */
/*     so the whole pipeline (signature → idempotency → booking) is     */
/*     exercised exactly as it would be with a real gateway.           */
/*                                                                    */
/*  isSandbox is always true, so the UI shows the TEST banner whenever  */
/*  this provider is active.                                           */
/* ------------------------------------------------------------------ */

import { hmacSha256Hex, safeEqual } from "./signature.js";
import { isMockPermitted } from "./provider.js";

export const MOCK_WEBHOOK_SECRET_FALLBACK = "mock-webhook-secret";

/**
 * Defence in depth: provider.js already refuses to hand back this adapter
 * outside local development, but the adapter refuses its own checkout too, so
 * a direct import cannot be used to start one.
 */
function assertPermitted(env) {
  if (!isMockPermitted(env)) {
    throw new Error(
      "The mock payment adapter is a local-development tool and is not permitted in this environment."
    );
  }
}

/** The mock signs with the same secret the webhook expects. */
function webhookSecret(env) {
  return String(env?.PAYMENT_WEBHOOK_SECRET || "") || MOCK_WEBHOOK_SECRET_FALLBACK;
}

export default {
  id: "mock",
  verified: true,
  isSandbox: true,

  async createCheckoutSession({
    checkoutUrlBase,
    bookingId,
    amount,
    currency,
    customer,
    env,
  }) {
    assertPermitted(env);
    const providerReference = `mock-${crypto.randomUUID()}`;
    const params = new URLSearchParams({
      session: providerReference,
      booking: bookingId,
      amount: String(amount),
      currency,
      name: customer?.name || "",
      phone: customer?.phone || "",
    });
    return {
      url: `${checkoutUrlBase}/api/v1/payments/mock-checkout?${params.toString()}`,
      providerReference,
    };
  },

  async verifyWebhook({ rawBody, headers, env }) {
    // Refuse in production so a well-known fallback secret can never be used to
    // forge an event, even if this adapter is somehow reached.
    assertPermitted(env);
    const signature = headers?.get?.("x-mock-signature") || "";
    const valid = await verifyHmac(
      webhookSecret(env),
      rawBody,
      signature
    );
    if (!valid) return { ok: false, reason: "invalid_signature" };

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { ok: false, reason: "invalid_json" };
    }

    if (!payload || !payload.event_id || !payload.booking_ref) {
      return { ok: false, reason: "missing_fields" };
    }

    const status = String(payload.status || "").toLowerCase();
    if (!["paid", "failed", "cancelled"].includes(status)) {
      return { ok: false, reason: "unknown_status" };
    }

    return {
      ok: true,
      eventId: String(payload.event_id),
      status,
      amount: payload.amount != null ? Number(payload.amount) : null,
      currency: payload.currency || "PKR",
      providerReference: payload.provider_reference || null,
      bookingRef: String(payload.booking_ref),
    };
  },

  async getPaymentStatus() {
    // The mock never stores anything server-side; the webhook is the source of
    // truth, so this always reports pending. Nothing confirms a booking from
    // this method.
    return { status: "pending" };
  },
};

async function verifyHmac(secret, message, signature) {
  const expected = await hmacSha256Hex(secret, message);
  return safeEqual(signature, expected);
}
