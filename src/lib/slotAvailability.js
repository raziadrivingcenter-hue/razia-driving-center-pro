// =============================================================================
// Slot Availability API client
// Reuses the existing fetchAvailability() from bookingApi.js (reads from
// the SOD-synced slot_availability table). Adds submitSlotBooking() for the
// slot-page registration form (name + phone + course + pick&drop + slot).
// =============================================================================

export { fetchAvailability } from "./bookingApi";

const API_BASE = import.meta.env.VITE_BOOKING_API_URL || "";

/**
 * Reserve a slot via the on-page registration form.
 *
 * Identity is proven with a Supabase access token (dashboard bookings). The
 * endpoint verifies the token server-side and derives the email from the
 * verified Auth user — the email is NEVER sent in the request body, so a
 * malicious or anonymous caller cannot impersonate a signed-in student.
 *
 * @param {{
 *   customer_name: string,
 *   customer_phone: string,
 *   preferred_date: string,
 *   preferred_time: string,
 *   course?: string,
 *   distance_km?: number,
 *   home_service?: boolean,
 *   address?: string,
 *   accessToken?: string,   // Supabase session JWT (dashboard only); omitted for public bookings
 * }} params
 * @returns {{ success: boolean, bookingId: string, status: string, message: string, whatsappLink: string }}
 */
export async function submitSlotBooking({
  customer_name,
  customer_phone,
  preferred_date,
  preferred_time,
  course = "",
  distance_km = 0,
  home_service = false,
  address = "",
  accessToken = "",
}) {
  const res = await fetch(`${API_BASE}/api/v1/slot-booking`, {
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
      distance_km,
      home_service,
      address,
    }),
  });

  if (res.status === 400) {
    const err = await res.json();
    const error = new Error(err.error || "Validation failed");
    error.code = "VALIDATION_ERROR";
    error.status = 400;
    error.details = err.details || [];
    throw error;
  }

  // 401 is returned when a dashboard access token is invalid/expired — surface
  // it distinctly so the UI can guide the student back to sign-in.
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || "Your sign-in is invalid. Please sign in again.");
    error.status = 401;
    throw error;
  }

  if (!res.ok) {
    const error = new Error("Booking submission failed. Please try again.");
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  return {
    success: data.success,
    bookingId: data.bookingId,
    status: data.status,
    message: data.message,
    whatsappLink: data.whatsappLink,
  };
}
