/* ------------------------------------------------------------------ */
/*  PayFast adapter — STRUCTURE ONLY, NOT VERIFIED.                    */
/*                                                                    */
/*  ⚠️  This adapter is intentionally incomplete. PayFast's signed      */
/*      payload format and webhook signature scheme have NOT been       */
/*      verified against their merchant documentation, and web access   */
/*      was unavailable while this was written. Nothing here is        */
/*      guessed into place.                                            */
/*                                                                    */
/*  Safety: `verified: false`. The checkout endpoint refuses to start a */
/*  session with an adapter whose `verified` flag is false, so this     */
/*  file CANNOT take a payment until the two functions marked TODO are  */
/*  filled in and the flag is flipped.                                 */
/*                                                                    */
/*  To finish this adapter you need, from the PayFast merchant panel or */
/*  integration guide:                                                 */
/*    1. The hosted-checkout endpoint for sandbox and for live.        */
/*    2. The exact signed-payload construction (parameter ordering,     */
/*       encoding, which fields are included, digest algorithm).        */
/*    3. How the webhook/ITN delivers its signature: header name or     */
/*       body field, and whether it signs the raw body or a canonical   */
/*       re-encoding of the parameters.                                */
/*    4. The success/cancel return URLs and whether they carry a        */
/*       payment status we should ignore (we do ignore it — only the    */
/*       webhook confirms a booking).                                   */
/*                                                                    */
/*  Paste those details and ONLY buildSignature() and the signature     */
/*  branch of verifyWebhook() should need to change. Everything else    */
/*  (idempotency, booking transitions, slot holds, logging) is already  */
/*  provider-independent and shared.                                    */
/* ------------------------------------------------------------------ */

export const PAYFAST_TODO = "PayFast signing scheme not verified — see functions/payments/payfast.js";

function required(name, value) {
  if (!value) {
    throw new Error(
      `PayFast is missing ${name}. Add it to the server environment (never as a VITE_ var).`
    );
  }
  return value;
}

export default {
  id: "payfast",
  // Flipped to true only after the TODO functions below are implemented and
  // checked against PayFast's own documentation.
  verified: false,
  // Whether sandbox keys are active is decided by isSandboxProvider(env) in
  // provider.js, which reads PAYFAST_SANDBOX directly.

  async createCheckoutSession({
    checkoutUrlBase,
    bookingId,
    amount,
    currency,
    customer,
    successUrl,
    cancelUrl,
    webhookUrl,
    env,
  }) {
    const merchantId = required("PAYFAST_MERCHANT_ID", env?.PAYFAST_MERCHANT_ID);
    const merchantKey = required("PAYFAST_MERCHANT_KEY", env?.PAYFAST_MERCHANT_KEY);
    const passphrase = required("PAYFAST_PASSPHRASE", env?.PAYFAST_PASSPHRASE);
    const sandbox = String(env?.PAYFAST_SANDBOX || "") === "true";

    const payload = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: successUrl,
      cancel_url: cancelUrl,
      notify_url: webhookUrl,
      email_address: "",
      name_first: customer?.name || "",
      m_payment_id: bookingId,
      amount: String(amount),
      item_name: "Driving course booking",
      currency_code: currency,
    };

    // TODO(PAYFAST): build the signed payload per the merchant docs.
    const signature = await buildSignature(payload, passphrase, sandbox);

    const host = sandbox
      ? "https://sandbox.payfast.co.za"
      : "https://www.payfast.co.za";

    const body = new URLSearchParams({ ...payload, signature }).toString();
    const url = `${host}/eng/process?${body}`;

    return {
      url,
      providerReference: bookingId,
      // Kept for the endpoint's return value; not part of the adapter contract.
      meta: { checkoutUrlBase, sandbox },
    };
  },

  async verifyWebhook({ rawBody, headers, env }) {
    const passphrase = required("PAYFAST_PASSPHRASE", env?.PAYFAST_PASSPHRASE);

    // TODO(PAYFAST): extract the signature from the gateway's delivery
    // mechanism (header vs body field) and verify it over the correct message.
    const signature = headers?.get?.("x-payfast-signature") || "";
    const message = rawBody;

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Many gateways POST form-encoded; support both once the docs confirm.
      payload = Object.fromEntries(new URLSearchParams(rawBody));
    }

    // TODO(PAYFAST): replace this with the verified check.
    const valid = await verifyPayFastSignature(message, signature, passphrase);
    if (!valid) return { ok: false, reason: "invalid_signature" };

    const bookingRef = String(payload?.m_payment_id || "");
    if (!bookingRef) return { ok: false, reason: "missing_booking_ref" };

    const rawStatus = String(payload?.payment_status || "").toLowerCase();
    const statusMap = { complete: "paid", fail: "failed", cancelled: "cancelled" };
    const status = statusMap[rawStatus];
    if (!status) return { ok: false, reason: "unknown_status" };

    return {
      ok: true,
      // TODO(PAYFAST): confirm the idempotent event identifier field name.
      eventId: String(payload?.pf_payment_id || payload?.m_payment_id || ""),
      status,
      amount: payload?.amount_gross != null ? Number(payload.amount_gross) : null,
      currency: "PKR",
      providerReference: payload?.pf_payment_id || null,
      bookingRef,
    };
  },

  async getPaymentStatus({ env }) {
    required("PAYFAST_MERCHANT_ID", env?.PAYFAST_MERCHANT_ID);
    // TODO(PAYFAST): query the gateway's status endpoint, or return pending and
    // rely on the webhook. Returning pending is safe: nothing confirms a
    // booking from this method.
    return { status: "pending" };
  },
};

/**
 * TODO(PAYFAST): implement per docs.
 * Must throw while unimplemented — a silently-wrong signature would be worse
 * than no checkout at all.
 */
async function buildSignature(_payload, _passphrase, _sandbox) {
  throw new Error(PAYFAST_TODO);
}

/**
 * TODO(PAYFAST): implement per docs.
 * Returning false rejects every webhook, which means a booking would never be
 * confirmed — loud, safe, and easy to notice in the logs.
 */
async function verifyPayFastSignature(_message, _signature, _passphrase) {
  throw new Error(PAYFAST_TODO);
}
