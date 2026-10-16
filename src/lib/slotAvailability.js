// =============================================================================
// Slot Availability API client
// Reuses the existing fetchAvailability() from bookingApi.js (reads from
// the SOD-synced slot_availability table). Adds submitSlotBooking() for the
// lightweight name+phone slot reservation endpoint.
// =============================================================================

export { fetchAvailability } from "./bookingApi";

const API_BASE = import.meta.env.VITE_BOOKING_API_URL || "";

/**
 * Reserve a slot with just name + phone.
 * @param {{ customer_name: string, customer_phone: string, preferred_date: string, preferred_time: string }} params
 * @returns {{ success: boolean, bookingId: string, status: string, message: string, whatsappLink: string }}
 */
export async function submitSlotBooking({
  customer_name,
  customer_phone,
  preferred_date,
  preferred_time,
}) {
  const res = await fetch(`${API_BASE}/api/v1/slot-booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name,
      customer_phone,
      preferred_date,
      preferred_time,
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
