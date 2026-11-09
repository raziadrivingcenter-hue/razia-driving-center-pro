// =============================================================================
// Payments API client
//
// The browser never sends a price. It sends coordinates and the course; the
// server re-derives the amount, creates a pending_payment booking with a slot
// hold, and returns a gateway checkout URL to redirect to.
// =============================================================================

const API_BASE = import.meta.env.VITE_BOOKING_API_URL || "";

const FALLBACK_CONFIG = { cardEnabled: false, sandbox: false, provider: "mock" };

/**
 * Read the non-secret payment configuration.
 * Failures degrade to "card payments off" — never to "on".
 */
export async function fetchPaymentConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/config`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { ...FALLBACK_CONFIG };
    const data = await res.json();
    return {
      cardEnabled: data.cardEnabled === true,
      sandbox: data.sandbox === true,
      provider: typeof data.provider === "string" ? data.provider : "mock",
    };
  } catch {
    return { ...FALLBACK_CONFIG };
  }
}

/**
 * Start a card checkout.
 *
 * @param {{
 *   customer_name: string,
 *   customer_phone: string,
 *   preferred_date: string,
 *   preferred_time: string,
 *   course: string,
 *   home_service: boolean,
 *   address?: string,
 *   area?: string,
 *   pickup?: { lat: number, lng: number } | null,
 *   distance_source: "map" | "manual",
 *   accessToken?: string,
 * }} params
 * @returns {Promise<{ bookingId: string, status: string, amount: number,
 *                    currency: string, checkoutUrl: string,
 *                    holdExpiresAt: string, message: string }>}
 */
export async function createCardCheckoutSession({
  customer_name,
  customer_phone,
  preferred_date,
  preferred_time,
  course,
  home_service,
  address = "",
  area = "",
  pickup = null,
  distance_source,
  accessToken = "",
}) {
  const res = await fetch(`${API_BASE}/api/v1/payments/create-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      customer_name,
      customer_phone,
      preferred_date,
      preferred_time,
      course,
      home_service,
      address,
      area,
      pickup,
      distance_source,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      data.error || "Could not start the checkout. Please try again."
    );
    error.status = res.status;
    error.code = data.code || "";
    // Tells the caller to fall back to the manual-confirmation endpoint.
    error.fallback = data.fallback || "";
    throw error;
  }

  return {
    bookingId: data.bookingId,
    status: data.status,
    amount: data.amount,
    currency: data.currency || "PKR",
    checkoutUrl: data.checkoutUrl,
    holdExpiresAt: data.holdExpiresAt,
    message: data.message || "",
  };
}
