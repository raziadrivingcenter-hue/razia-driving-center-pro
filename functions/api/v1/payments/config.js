/* ------------------------------------------------------------------ */
/*  GET /api/v1/payments/config                                        */
/*                                                                    */
/*  The only public description of the payment setup. Tells the UI     */
/*  whether the card option is live and whether test keys are active,  */
/*  without ever exposing a merchant id, key, or webhook secret.       */
/* ------------------------------------------------------------------ */

import {
  isSandboxProvider,
  isCardProviderEnabled,
  NO_PROVIDER,
} from "../../../payments/provider.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });

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

  const providerName = String(env.PAYMENT_PROVIDER || NO_PROVIDER).toLowerCase();

  // The card option is offered only when the flag is explicitly on AND a real
  // gateway is configured. "none" is the seeded default in school_config and
  // means the school has not chosen a gateway, so it must report disabled even
  // if the flag is on. The dropdown keeps showing "Coming Soon" otherwise.
  const cardEnabled =
    String(env.PAYMENTS_CARD_ENABLED || "") === "true" &&
    isCardProviderEnabled(env);

  return json({
    cardEnabled,
    // Non-secret, safe to show in the UI ("payfast", "none").
    provider: providerName,
    // Drives the TEST banner. Sandbox keys must never look like a live shop.
    // With no provider there are no live keys, so sandbox stays true.
    sandbox: isSandboxProvider(env),
  });
}
