/* ------------------------------------------------------------------ */
/*  GET /api/v1/payments/return?result=success|cancel&booking=<uuid>   */
/*                                                                    */
/*  The gateway sends the customer back here. This page NEVER confirms  */
/*  a booking — it only polls the status endpoint, which reports what    */
/*  the webhook already wrote. A customer who lands here without paying  */
/*  sees "pending", not "confirmed".                                    */
/*                                                                    */
/*  Deliberately server-rendered rather than an SPA route: it works      */
/*  even if the customer's session on the main site has expired.         */
/* ------------------------------------------------------------------ */

import { isSandboxProvider } from "../../../payments/provider.js";

const VIEW = {
  verifying: {
    title: "Verifying your payment…",
    body: "Do not close this page. We are confirming your payment with the bank.",
    tone: "pending",
  },
  pending: {
    title: "Payment pending",
    body: "We have not received confirmation from your bank yet. This page will update automatically.",
    tone: "pending",
  },
  paid: {
    title: "Payment received",
    body: "Your slot is confirmed. Our team will contact you shortly.",
    tone: "success",
  },
  payment_failed: {
    title: "Payment failed",
    body: "Your bank declined the payment. Your slot hold has been released — please book again.",
    tone: "error",
  },
  payment_cancelled: {
    title: "Payment cancelled",
    body: "You cancelled at the payment page. Your slot hold has been released.",
    tone: "error",
  },
  expired: {
    title: "Payment window closed",
    body: "We did not receive your payment in time, so the slot was released. Please book again.",
    tone: "error",
  },
};

const TONE = {
  pending: { ring: "#f59e0b", bg: "#fffbeb" },
  success: { ring: "#16a34a", bg: "#f0fdf4" },
  error: { ring: "#dc2626", bg: "#fef2f2" },
};

const escapeHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function page({ sandbox, view, bookingId, amount, currency, transactionId }) {
  const tone = TONE[view.tone] || TONE.pending;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(view.title)} — Razia Driving Center</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px;
    font-family: "Raleway", ui-sans-serif, system-ui, -apple-system, sans-serif;
    background: #f9fafb; color: #111827;
  }
  .card {
    width: 100%; max-width: 440px; background: #fff; border: 1px solid #e5e7eb;
    border-radius: 16px; padding: 30px; text-align: center;
    box-shadow: 0 8px 24px rgba(0,0,0,.06);
  }
  .ring {
    width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 9999px;
    display: flex; align-items: center; justify-content: center;
    background: ${tone.bg}; color: ${tone.ring}; font-size: 26px; font-weight: 800;
  }
  .badge {
    display: inline-block; margin-bottom: 12px; padding: 3px 10px; border-radius: 9999px;
    background: rgba(255,98,1,.1); color: #b8490a;
    font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  }
  h1 { margin: 0 0 8px; font-size: 21px; font-weight: 800; }
  p { margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; }
  .meta {
    margin-top: 18px; padding: 12px; border-radius: 10px; background: #f9fafb;
    font-size: 13px; color: #374151; display: flex; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .meta b { font-variant-numeric: tabular-nums; }
  .actions { margin-top: 20px; }
  .actions a {
    display: inline-block; padding: 11px 20px; border-radius: 10px;
    background: #ff6201; color: #fff; text-decoration: none;
    font-size: 14px; font-weight: 700;
  }
</style>
</head>
<body>
  <main class="card">
    ${sandbox ? '<span class="badge">Test mode — no real charge</span>' : ""}
    <div class="ring" id="ring" aria-hidden="true">…</div>
    <h1 id="title">${escapeHtml(view.title)}</h1>
    <p id="body">${escapeHtml(view.body)}</p>
    <div class="meta">
      <span>Booking <b>#${escapeHtml(bookingId)}</b></span>
      ${amount != null ? `<span>Amount <b>${escapeHtml(amount)} ${escapeHtml(currency)}</b></span>` : ""}
      ${transactionId ? `<span>Txn <b>${escapeHtml(transactionId)}</b></span>` : ""}
    </div>
    <div class="actions"><a href="/">Back to site</a></div>
  </main>
<script>
  const booking = ${JSON.stringify(bookingId)};
  const initial = ${JSON.stringify(view)};
  const ring = document.getElementById("ring");
  const title = document.getElementById("title");
  const body = document.getElementById("body");
  const views = ${JSON.stringify(VIEW)};

  function render(v, info) {
    const next = views[v] || initial;
    title.textContent = next.title;
    body.textContent = next.body;
    ring.textContent = v === "paid" ? "✓" : v === "verifying" || v === "pending" ? "…" : "!";
    if (info && info.transactionId) {
      const meta = document.querySelector(".meta");
      if (meta && !meta.dataset.txn) {
        meta.dataset.txn = "1";
        const span = document.createElement("span");
        span.innerHTML = "Txn <b></b>";
        span.querySelector("b").textContent = info.transactionId;
        meta.appendChild(span);
      }
    }
  }

  let attempts = 0;
  async function poll() {
    try {
      const res = await fetch("/api/v1/payments/status?booking=" + encodeURIComponent(booking), { cache: "no-store" });
      if (!res.ok) { render("pending"); return; }
      const data = await res.json();
      if (data.status === "paid") { render("paid", data); return; }
      if (data.status === "payment_failed") { render("payment_failed", data); return; }
      if (data.status === "payment_cancelled") { render("payment_cancelled", data); return; }
      if (data.status === "expired") { render("expired", data); return; }
      // pending_payment → keep waiting, but stop after ~25 minutes.
      attempts += 1;
      if (attempts < 50) setTimeout(poll, 3000);
      else render("expired");
    } catch {
      setTimeout(poll, 5000);
    }
  }
  poll();
</script>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const params = new URL(request.url).searchParams;
  const bookingId = params.get("booking") || "";
  const result = params.get("result") || "success";

  const view =
    result === "cancel" ? VIEW.pending : VIEW.verifying;

  return new Response(
    page({
      sandbox: isSandboxProvider(env),
      view,
      bookingId,
      amount: null,
      currency: "PKR",
      transactionId: null,
    }),
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
