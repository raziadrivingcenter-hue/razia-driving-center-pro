import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

/**
 * Payment outcome states for the booking card.
 *
 *   redirecting — handing the customer to the gateway's hosted page
 *   pending     — booking held, waiting for the webhook to confirm
 *   failed      — the gateway reported a failure
 *   cancelled   — the customer cancelled at the gateway
 *
 * The authoritative version of these states lives on the server-rendered
 * return page (/api/v1/payments/return), which the gateway redirects to and
 * which polls the read-only status endpoint. This component covers the states
 * the customer sees before they leave the site, and on returning to the form.
 */
const STATES = {
  redirecting: {
    icon: Loader2,
    spin: true,
    tone: "text-[#FF6201]",
    title: "Redirecting to payment…",
    body: "Do not close this tab. You will return here automatically after paying.",
  },
  pending: {
    icon: Clock,
    spin: false,
    tone: "text-amber-600",
    title: "Payment pending",
    body: "We are waiting for your bank to confirm the payment. This usually takes a minute.",
  },
  failed: {
    icon: XCircle,
    spin: false,
    tone: "text-red-600",
    title: "Payment failed",
    body: "The payment could not be completed. Your slot hold has been released.",
  },
  cancelled: {
    icon: AlertCircle,
    spin: false,
    tone: "text-red-600",
    title: "Payment cancelled",
    body: "You cancelled at the payment page. Your slot hold has been released.",
  },
  paid: {
    icon: CheckCircle2,
    spin: false,
    tone: "text-green-600",
    title: "Payment received",
    body: "Your slot is confirmed. Our team will contact you shortly.",
  },
};

export default function PaymentStatus({ state, message, onRetry, onBookAnother }) {
  const config = STATES[state];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
        <Icon
          size={28}
          className={`${config.tone} ${config.spin ? "animate-spin" : ""}`}
        />
      </div>
      <h3 className="mt-4 text-xl font-black text-gray-900">{config.title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message || config.body}</p>

      <div className="mt-5 space-y-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-lg bg-[#FF6201] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e65600]"
          >
            Try again
          </button>
        )}
        {onBookAnother && (
          <button
            type="button"
            onClick={onBookAnother}
            className="w-full rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Book Another Slot
          </button>
        )}
      </div>
    </div>
  );
}
