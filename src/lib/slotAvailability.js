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
 * @param {{
 *   customer_name: string,
 *   customer_phone: string,
 *   preferred_date: string,
 *   preferred_time: string,
 *   course?: string,
 *   distance_km?: number,
 *   home_service?: boolean,
 *   address?: string,
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
}) {
  const res = await fetch(`${API_BASE}/api/v1/slot-booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    error.details = err.details || [];
    throw error;
  }

  if (!res.ok) {
    throw new Error("Booking submission failed. Please try again.");
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
