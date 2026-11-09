/* ------------------------------------------------------------------ */
/*  Payment provider factory.                                          */
/*                                                                    */
/*  One adapter per gateway. Switching providers means changing the    */
/*  PAYMENT_PROVIDER env var — no call site imports an adapter by      */
/*  name, so nothing else in the codebase knows which gateway is live. */
/* ------------------------------------------------------------------ */

/**
 * Adapter contract. Every adapter exports a default object with this shape.
 *
 *   id: string            — stable slug, stored on payment_events.provider
 *   verified: boolean     — false until the integration has been checked
 *                           against the gateway's own docs. The checkout
 *                           endpoint refuses to start a session with an
 *                           unverified adapter, so a guessed integration can
 *                           never take a payment.
 *
 *   Sandbox mode is NOT an adapter property: isSandboxProvider(env) reads the
 *   provider's own sandbox env var and drives the TEST banner.
 *
 *   createCheckoutSession({
 *     checkoutUrlBase,     — origin of this site, for return URLs
 *     bookingId,           — uuid, also sent as the merchant order reference
 *     amount,              — integer/decimal in the smallest currency unit the
 *                            gateway expects; ALWAYS from server-side pricing
 *     currency,            — ISO code, e.g. "PKR"
 *     customer: { name, phone },
 *     successUrl, cancelUrl, webhookUrl
 *   }) -> { url, providerReference }
 *
 *   verifyWebhook({ rawBody, headers, env }) ->
 *     { ok: true, eventId, status, amount, currency, providerReference, bookingRef }
 *     { ok: false, reason }
 *     `status` must be one of: paid | failed | cancelled
 *     `eventId` must be idempotent (the same event delivered twice maps to the
 *     same value) — the pipeline deduplicates on it.
 *     `bookingRef` is how the gateway tells us which booking this is; the
 *     pipeline never trusts an amount or status without it.
 *
 *   getPaymentStatus({ providerReference, env }) ->
 *     { status: "paid" | "pending" | "failed" | "cancelled" }
 *     Optional. Used for reconciliation, never to confirm a booking.
 */

const PROVIDERS = {
  mock: () => import("./mock.js"),
  payfast: () => import("./payfast.js"),
  safepay: () => import("./safepay.js"),
};

/**
 * The value that means "no gateway is wired up".
 *
 * This is the seeded default in school_config.payment_provider, and it must
 * never be treated as a working provider: a school that has not chosen a
 * gateway gets card payments disabled, not a silent fallback to mock.
 */
export const NO_PROVIDER = "none";

/**
 * Production markers.
 *
 * Cloudflare Pages injects CONTEXT=production for a production deploy; the
 * other two cover `wrangler pages dev`, plain Node, and any host that sets a
 * generic environment variable. CF_PAGES is set on EVERY Pages deploy —
 * including previews — and a preview is still publicly reachable, so it counts
 * as production here.
 *
 * This is deliberately conservative: an unknown host reports "not production"
 * and must therefore opt in explicitly with PAYMENTS_ALLOW_MOCK.
 */
export function isProductionEnv(env = {}) {
  const text = (value) => String(value || "").trim().toLowerCase();
  if (text(env.CONTEXT) === "production") return true;
  if (text(env.NODE_ENV) === "production") return true;
  if (text(env.ENVIRONMENT) === "production") return true;
  if (String(env.CF_PAGES || "").trim() === "1") return true;
  return false;
}

/**
 * The mock adapter is a local-development stand-in for the gateway. It is
 * permitted only when the operator has explicitly opted in AND the environment
 * is not a deployed one. Both conditions must hold; the flag alone is never
 * enough on a public deployment.
 */
export function isMockPermitted(env = {}) {
  const flag = String(env.PAYMENTS_ALLOW_MOCK || "").trim().toLowerCase();
  return flag === "true" && !isProductionEnv(env);
}

/**
 * True only when a real gateway is configured and usable.
 *
 *   PAYMENT_PROVIDER unset / "" / "none"  -> false (card payments disabled)
 *   "mock"                                 -> true only outside production AND
 *                                              PAYMENTS_ALLOW_MOCK=true
 *   any other known adapter                -> true
 *   an unknown name                        -> false (never start a checkout on
 *                                              a provider we cannot load)
 *
 * Use this to decide whether to offer the card option at all. It fails closed:
 * anything unexpected reports "disabled" rather than "enabled".
 */
export function isCardProviderEnabled(env = {}) {
  const name = String(env.PAYMENT_PROVIDER || "").trim().toLowerCase();
  if (name === "" || name === NO_PROVIDER) return false;
  if (name === "mock") return isMockPermitted(env);
  return Object.prototype.hasOwnProperty.call(PROVIDERS, name);
}

export async function getProvider(env = {}) {
  const name = String(env.PAYMENT_PROVIDER || "mock").toLowerCase();

  // Fail closed with a precise message. Without this, "none" would fall through
  // to the generic "Unknown PAYMENT_PROVIDER" error below, which reads like a
  // typo rather than the intended "no gateway configured".
  if (name === NO_PROVIDER) {
    throw new Error(
      "No payment provider is configured (PAYMENT_PROVIDER is \"none\"). Online card payment is disabled."
    );
  }

  const load = PROVIDERS[name];
  if (!load) {
    throw new Error(
      `Unknown PAYMENT_PROVIDER "${name}". Expected one of: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }
  // The mock adapter is a development tool — refuse it on any deployed site,
  // even if the feature flag is on and the flag above is set.
  if (name === "mock" && !isMockPermitted(env)) {
    throw new Error(
      'PAYMENT_PROVIDER "mock" is a local-development adapter. ' +
        "Set PAYMENTS_ALLOW_MOCK=true outside production to use it."
    );
  }
  const mod = await load();
  const provider = mod.default;
  if (!provider || typeof provider.createCheckoutSession !== "function" ||
      typeof provider.verifyWebhook !== "function") {
    throw new Error(`Payment provider "${name}" does not implement the adapter contract.`);
  }
  return provider;
}

/** True when the live keys belong to a sandbox/test environment. */
export function isSandboxProvider(env = {}) {
  const name = String(env.PAYMENT_PROVIDER || "mock").toLowerCase();
  if (name === "mock") return true;
  if (name === "payfast") return String(env.PAYFAST_SANDBOX || "") === "true";
  if (name === "safepay") return String(env.SAFEPAY_SANDBOX || "") === "true";
  return true;
}
