// =============================================================================
// Canonical operating-hours + slot configuration for Razia Driving Center.
// Single source of truth — imported by the availability API and the booking
// endpoints. Keeping these constants in one place prevents the backend and
// frontend from drifting apart again (which is what produced the old
// 08:00/20:00 + 60-min inconsistency).
// =============================================================================
// Business rule (confirmed): 07:00 AM – 07:00 PM, Monday–Sunday, Asia/Karachi.
// Slots are 30 minutes; the last bookable slot starts at 18:30 (runs 18:30–19:00).
// =============================================================================

export const OPERATING_HOURS = { start: "07:00", end: "19:00" };
export const SLOT_DURATION_MIN = 30;
export const MAX_DISTANCE_KM = 20;
export const RATE_PER_KM = 50;
export const PLUS_FREE_KM = 2;

// Last valid slot START time. A 30-min slot starting at 18:30 ends at 19:00,
// exactly at closing. Anything later would run past operating hours.
export const LAST_SLOT_START = "18:30";

const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/;

/**
 * Validate a slot start time. Pure function — safe to use in tests.
 * @param {string} time — "HH:MM" or "HH:MM:SS"
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateSlotTime(time) {
  if (!time || typeof time !== "string") {
    return { ok: false, error: "Time is required" };
  }
  const m = time.match(TIME_RE);
  if (!m) {
    return { ok: false, error: "Time must be in HH:MM format" };
  }
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return { ok: false, error: "Time has an invalid hour or minute" };
  }
  // Must align to the 30-minute slot boundary (__:00 or __:30).
  if (mm !== 0 && mm !== 30) {
    return { ok: false, error: "Time must be on the hour or half-hour" };
  }
  const normalized = `${m[1]}:${m[2]}`;
  // Slot must start within operating hours and leave room to finish.
  if (normalized < OPERATING_HOURS.start) {
    return { ok: false, error: `Time must be at or after ${OPERATING_HOURS.start}` };
  }
  if (normalized > LAST_SLOT_START) {
    return { ok: false, error: `Time must be no later than ${LAST_SLOT_START}` };
  }
  return { ok: true };
}

/**
 * Generate all valid slot start times for a single day (pure).
 * Used by regression tests and any future fallback schedule.
 * @returns {string[]} — ["07:00", "07:30", ... "18:30"] (24 slots)
 */
export function generateSlotStarts() {
  const out = [];
  const [openH] = OPERATING_HOURS.start.split(":").map(Number);
  const [closeH] = OPERATING_HOURS.end.split(":").map(Number);
  const openMin = openH * 60;
  const closeMin = closeH * 60;
  for (let m = openMin; m < closeMin; m += SLOT_DURATION_MIN) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}
