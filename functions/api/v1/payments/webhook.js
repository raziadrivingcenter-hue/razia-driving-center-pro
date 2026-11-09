/* ------------------------------------------------------------------ */
/*  POST /api/v1/payments/webhook                                      */
/*                                                                    */
/*  The ONLY place a booking is confirmed paid. Reads the raw body —    */
/*  signature verification is done over the exact bytes, so this        */
/*  handler must never call request.json() first.                       */
/*                                                                    */
/*  Providers POST form-encoded or JSON; both arrive as text and are    */
/*  handed to the adapter untouched.                                    */
/* ------------------------------------------------------------------ */

import { getProvider } from "../../../payments/provider.js";
import { handleWebhook } from "../../../payments/webhookPipeline.js";
import { getServiceRoleClient } from "../../../lib/supabaseRest.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let provider;
  try {
    provider = await getProvider(env);
  } catch (error) {
    console.error("Webhook: unknown provider:", error?.message || error);
    return new Response(JSON.stringify({ ok: false, error: "provider_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const rawBody = await request.text();
  const client = getServiceRoleClient(env);

  return handleWebhook({
    provider,
    rawBody,
    headers: request.headers,
    env,
    client,
  });
}
