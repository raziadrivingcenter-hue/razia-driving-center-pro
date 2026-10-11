// =============================================================================
// Booking API Client — talks to Cloudflare Functions (not Supabase directly)
// =============================================================================
// All calls go through /api/v1/* endpoints which are Cloudflare Pages Functions.
// These functions use the anon key server-side — no service_role exposure.
// =============================================================================

const API_BASE = import.meta.env.VITE_BOOKING_API_URL || "";

/**
 * Fetch available slots for a given date.
 * @param {string} date — YYYY-MM-DD
 * @returns {{ date, availableSlots: [{time, display}], blockedSlots: [{time, display, reason}], totalSlots, availableCount, blockedCount }}
 */
export async function fetchAvailability(date) {
  const res = await fetch(`${API_BASE}/api/v1/availability?date=${encodeURIComponent(date)}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch availability. Please try again.");
  }

  const data = await res.json();

  return {
    date: data.date,
    operatingHours: data.operating_hours,
    slotDurationMin: data.slot_duration_min,
    availableSlots: data.available_slots.map((s) => ({
      time: s.time,
      display: s.display,
    })),
    blockedSlots: data.blocked_slots.map((s) => ({
      time: s.time,
      display: s.display,
      reason: s.reason,
    })),
    totalSlots: data.total_slots,
    availableCount: data.available_count,
    blockedCount: data.blocked_count,
  };
}

/**
 * Submit a booking to the API.
 * @param {object} booking — { customer_name, phone_number, slot_time, course_start_date, duration_days, plan_type, distance_km, pickup_address, area, course_fee, distance_fee, total_fee, notes }
 * @returns {{ success, bookingId, status, travelTimeMin, whatsappLink }}
 */
export async function submitBooking(booking) {
  const res = await fetch(`${API_BASE}/api/v1/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });

  if (res.status === 409) {
    const err = await res.json();
    const error = new Error(err.error || "Slot conflict");
    error.code = "SLOT_CONFLICT";
    throw error;
  }

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
    travelTimeMin: data.travel_time_min,
    whatsappLink: data.whatsappLink,
  };
}

/**
 * Calculate fee via API (server-side pricing).
 * @param {{ planType?: string, courseFee?: number, totalDays: number, distanceKm: number }} params
 * @returns {object} Full breakdown from API
 */
export async function calculateFee({ planType, courseFee, totalDays, distanceKm }) {
  const body = { total_days: totalDays, distance_km: distanceKm };

  if (planType) {
    body.plan_type = planType;
  } else {
    body.course_fee = courseFee;
  }

  const res = await fetch(`${API_BASE}/api/v1/calculate-fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Fee calculation failed.");
  }

  return res.json();
}

/**
 * Static slot system info (mirrors API rules).
 */
export function getSlotSystemInfo() {
  return {
    slotDurationMin: 30,
    operatingHours: { start: "08:00", end: "20:00" },
    travelTimePerKm: 5,
    maxDistanceKm: 20,
    ratePerKm: 50,
    plusFreeKm: 2,
  };
}
