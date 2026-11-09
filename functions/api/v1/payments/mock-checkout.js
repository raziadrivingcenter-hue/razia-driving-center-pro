/* ------------------------------------------------------------------ */
/*  GET /api/v1/payments/mock-checkout?session=...&booking=...         */
/*                                                                    */
/*  A stand-in for the gateway's hosted page, so the whole flow can be */
/*  exercised locally with no merchant account. The page offers Pay and */
/*  Cancel; either one POSTs a correctly signed event to the REAL        */
/*  webhook endpoint, which is what makes the mock faithful.            */
/*                                                                    */
/*  Signatures are computed here, server-side, and embedded — the        */
/*  webhook secret never reaches the browser.                           */
/* ------------------------------------------------------------------ */

import { hmacSha256Hex } from "../../../payments/signature.js";
import { MOCK_WEBHOOK_SECRET_FALLBACK } from "../../../payments/mock.js";
import { isSandboxProvider, isMockPermitted } from "../../../payments/provider.js";

function secret(env) {
  return String(env?.PAYMENT_WEBHOOK_SECRET || "") || MOCK_WEBHOOK_SECRET_FALLBACK;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAGE = (title, amount, currency, bookingId, outcomes, sandbox) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px;
    font-family: "Raleway", ui-sans-serif, system-ui, -apple-system, sans-serif;
    background: #f9fafb; color: #111827;
  }
  .card {
    width: 100%; max-width: 420px; background: #fff; border: 1px solid #e5e7eb;
    border-radius: 16px; padding: 28px; box-shadow: 0 8px 24px rgba(0,0,0,.06);
  }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 9999px;
    background: rgba(255,98,1,.1); color: #b8490a;
    font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  }
  h1 { margin: 14px 0 4px; font-size: 22px; font-weight: 800; }
  p { margin: 0 0 18px; font-size: 14px; color: #6b7280; line-height: 1.5; }
  .amount {
    font-size: 32px; font-weight: 800; letter-spacing: -.02em;
    margin: 0 0 20px; font-variant-numeric: tabular-nums;
  }
  .row { display: flex; gap: 10px; }
  button {
    flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid transparent;
    font: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
  }
  .pay { background: #ff6201; color: #fff; }
  .pay:hover { background: #e65600; }
  .cancel { background: #fff; border-color: #e5e7eb; color: #374151; }
  .cancel:hover { background: #f9fafb; }
  .ref { margin-top: 18px; font-size: 12px; color: #9ca3af; word-break: break-all; }
  .status { margin-top: 16px; font-size: 13px; font-weight: 600; }
</style>
</head>
<body>
  <main class="card">
    ${sandbox ? '<span class="badge">Test mode — no real charge</span>' : ""}
    <h1>${escapeHtml(title)}</h1>
    <p>This is the mock gateway page. Choose an outcome to send a signed event to the real webhook endpoint.</p>
    <div class="amount">${escapeHtml(amount)} <span style="font-size:16px;font-weight:600;color:#6b7280">${escapeHtml(currency)}</span></div>
    <div class="row">
      <button class="pay" data-outcome="paid">Pay now</button>
      <button class="cancel" data-outcome="cancelled">Cancel</button>
    </div>
    <div class="ref">Booking: ${escapeHtml(bookingId)}</div>
    <div class="status" id="status" role="status" aria-live="polite"></div>
  </main>
<script>
  const OUTCOMES = ${outcomes};
  const statusEl = document.getElementById("status");
  document.querySelectorAll("button[data-outcome]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const outcome = OUTCOMES[btn.dataset.outcome];
      if (!outcome) return;
      btn.disabled = true;
      statusEl.textContent = "Sending…";
      try {
        const res = await fetch("/api/v1/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-mock-signature": outcome.signature },
          body: outcome.body,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.duplicated) {
          statusEl.textContent = "This event was already processed — the webhook ignored it.";
        } else if (res.ok) {
          statusEl.textContent = "Delivery accepted (" + (data.confirmed ? "confirmed" : "recorded") + ").";
        } else {
          statusEl.textContent = "Rejected: " + (data.error || res.status);
        }
      } catch (err) {
        statusEl.textContent = "Delivery failed: " + err.message;
      }
    });
  });
</script>
</body>
</html>`;

export async function onRequest(context) {
  const { request, env } = context;

  // This page is a development stand-in for the gateway's hosted checkout. It
  // must never be reachable on a deployed site, so it answers 404 there rather
  // than rendering a page that can mint signed webhook events.
  if (!isMockPermitted(env)) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const params = new URL(request.url).searchParams;

  const bookingId = params.get("booking") || "";
  const sessionRef = params.get("session") || "";
  const amount = params.get("amount") || "0";
  const currency = params.get("currency") || "PKR";

  // Reachable only when the mock provider is active, so this is always a test.
  const sandbox = isSandboxProvider(env);

  if (!bookingId || !sessionRef) {
    return new Response("Missing session or booking parameter", { status: 400 });
  }

  const build = (status) => {
    // The event id is stable per (session, status) so a repeated click is a
    // true duplicate delivery and exercises the idempotency path.
    const eventId = `mock-${sessionRef}-${status}`;
    const payload = {
      event_id: eventId,
      booking_ref: bookingId,
      status,
      amount: Number(amount),
      currency,
      provider_reference: `mock-txn-${eventId}`,
    };
    const body = JSON.stringify(payload);
    return { body, eventId, payload };
  };

  const outcomes = {};
  for (const status of ["paid", "cancelled"]) {
    const { body } = build(status);
    outcomes[status] = {
      body,
      signature: await hmacSha256Hex(secret(env), body),
    };
  }

  return new Response(
    PAGE("Mock checkout", amount, currency, bookingId, JSON.stringify(outcomes), sandbox),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
