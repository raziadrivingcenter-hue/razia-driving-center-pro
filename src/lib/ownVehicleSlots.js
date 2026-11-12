// =============================================================================
// Own-Vehicle Slot Selection Logic
// =============================================================================
// Pure functions — no React, no JSX, no DOM. Same 07:00–19:00 / 30-minute grid
// as the /slot-availability page, plus the lesson-length rule: a lesson of N
// minutes occupies ceil(N / 30) consecutive tiles, so a start tile is only
// selectable when every tile in that range is 'available'.
// =============================================================================

// 24 half-hour slots from 07:00 to 19:00 (start times).
export const SLOT_STARTS = Array.from({ length: 24 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

// The three period columns. Row counts: Morning 10, Afternoon 10, Evening 4.
export const PERIODS = [
  { key: "morning", label: "Morning", range: [7 * 60, 12 * 60] },
  { key: "afternoon", label: "Afternoon", range: [12 * 60, 17 * 60] },
  { key: "evening", label: "Evening", range: [17 * 60, 19 * 60] },
];

export function timeToMin(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// "09:00" → "9:00 AM"
export function formatTime12(timeStr) {
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

// A lesson of `minutes` needs this many consecutive 30-minute tiles.
// 30 → 1, 40/50/60 → 2.
export function tilesNeeded(minutes) {
  return Math.max(1, Math.ceil(minutes / 30));
}

// The slots covered by a lesson starting at `slot`. Fewer than `need` entries
// means the lesson would run past the end of the day.
export function rangeSlots(slot, need, slotStarts = SLOT_STARTS) {
  const index = slotStarts.indexOf(slot);
  if (index === -1) return [];
  return slotStarts.slice(index, index + need);
}

// Add minutes to a "HH:MM" time string (wraps at midnight).
export function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// The clock range a lesson occupies: the first tile's start through the END of
// the last tile. A 2-tile lesson at "16:00" runs 16:00–17:00, so the summary
// must use the end of the last tile, not the last tile's start.
//   lessonRange("16:00", 2) → { start: "16:00", end: "17:00" }
export function lessonRange(slot, need, slotStarts = SLOT_STARTS) {
  const range = rangeSlots(slot, need, slotStarts);
  if (!range.length) return { start: slot, end: slot };
  return { start: range[0], end: addMinutes(range[range.length - 1], 30) };
}

// A start slot is selectable only when EVERY tile in its range is available.
// Travel, booked, advance and empty tiles are never selectable.
export function isSelectableStart(slot, statusBySlot, need, slotStarts = SLOT_STARTS) {
  const range = rangeSlots(slot, need, slotStarts);
  if (range.length !== need) return false;
  return range.every((s) => statusBySlot[s]?.status === "available");
}

// "16:00"–"17:00" → "4:00 to 5:00 PM" (drop the shared suffix from the start).
// "11:30"–"12:30" → "11:30 AM to 12:30 PM".
export function formatTimeRange(startStr, endStr) {
  const start = formatTime12(startStr);
  const end = formatTime12(endStr);
  const startSuffix = start.slice(-2);
  const endSuffix = end.slice(-2);

  if (startSuffix === endSuffix) {
    return `${start.slice(0, -2).trim()} to ${end}`;
  }
  return `${start} to ${end}`;
}

// "2026-11-12" → "Tue 12 Nov"
export function formatDateShort(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Group the flat slot list into the three period columns.
export function slotsByPeriod(slotStarts = SLOT_STARTS) {
  return PERIODS.map((period) => ({
    ...period,
    slots: slotStarts.filter(
      (s) => timeToMin(s) >= period.range[0] && timeToMin(s) < period.range[1]
    ),
  }));
}
