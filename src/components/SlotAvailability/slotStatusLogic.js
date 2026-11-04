// Pure slot-grid aggregation for the Book-a-Slot page — no React, no DOM,
// safe to unit-test with `node --test`.
//
// Extracted from SlotAvailability.jsx so the area-travel matching rules can be
// covered by tests (see slotStatusLogic.test.js).

// Normalize an area string for comparison: trim, lowercase, collapse spaces.
// Used to match the visitor's selected area against a slot's promo_area and a
// travel tile's destination area. No aliasing is applied — "Shadman" and
// "Shadman 1" are intentionally NOT treated as equivalent.
export const normalizeArea = (a) =>
  (a || "").trim().toLowerCase().replace(/\s+/g, " ");

// Aggregate per-vehicle slot records into one status per grid cell.
// Priority: available (any vehicle free) > booked (any booking) > travel > empty.
//
// A slot is available as long as ANY vehicle can take it, even if others are
// booked/traveling. Travel is shown only when NO vehicle can take it (none
// available, none booked, at least one travel-blocked). Travel is keyed
// strictly on block_reason, never on area.
//
// Area-specific travel: when the visitor's selected area equals a
// `travel_going` tile's destination, that cell becomes `area-available`
// (bookable, red-orange gradient). `travel_returning` and non-matching
// destinations stay `travel` (amber/unavailable).
export function computeSlotStatus({ data, effectiveArea, slotStarts, timeToMin }) {
  const result = {};
  for (const slot of slotStarts) result[slot] = { status: "empty" };
  if (!data) return result;

  for (const slot of slotStarts) {
    const gridMin = timeToMin(slot);

    // 1) Available takes priority if ANY vehicle is free at this cell — a
    //    slot is bookable as long as one vehicle can take it, even if other
    //    vehicles are booked/traveling. Surface promo info if present.
    const freeEntries = (data.availableSlots || []).filter(
      (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
    );
    if (freeEntries.length > 0) {
      const withPromo = freeEntries.find((s) => s.promoPercent && s.promoArea);
      result[slot] = {
        status: "available",
        promoPercent: withPromo ? withPromo.promoPercent : null,
        promoArea: withPromo ? withPromo.promoArea : null,
      };
      continue;
    }

    // 2) Booked — no vehicle free, at least one booking.
    const booking = (data.blockedSlots || []).find(
      (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
    );
    if (booking) {
      result[slot] = { status: "booked" };
      continue;
    }

    // 3) Travel — no vehicle free or booked, at least one travel-blocked.
    //    Keep ALL travel records for the cell so an area-specific match can
    //    be found: a `travel_going` tile whose destination equals the
    //    visitor's selected area becomes bookable (red-orange gradient),
    //    while `travel_returning` (and non-matching destinations) stay amber.
    const travelEntries = (data.travelSlots || []).filter(
      (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
    );
    if (travelEntries.length > 0) {
      const areaMatch = effectiveArea
        ? travelEntries.find(
            (s) =>
              s.blockReason === "travel_going" &&
              normalizeArea(s.area) === normalizeArea(effectiveArea)
          )
        : null;
      if (areaMatch) {
        result[slot] = {
          status: "area-available",
          blockReason: "travel_going",
          area: areaMatch.area,
          vehicleId: areaMatch.vehicleId,
          vehicleName: areaMatch.vehicleName,
        };
        continue;
      }
      const travel = travelEntries[0];
      result[slot] = {
        status: "travel",
        blockReason: travel.blockReason,
        area: travel.area,
      };
    }
  }
  return result;
}
