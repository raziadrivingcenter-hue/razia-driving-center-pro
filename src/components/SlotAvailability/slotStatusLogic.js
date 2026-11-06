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
// Priority: advance (any advance_booked row) > available (any vehicle free) >
// booked (any booking) > travel > empty.
//
// Advance-booked tiles are detected strictly on block_reason and are never
// selectable. They outrank "available" so a tile the desktop has already
// promised to a future course is never offered, matching the desktop's own
// precedence (booked > advance_booked > claimable travel > available).
//
// A slot is available as long as ANY vehicle can take it, even if others are
// booked/traveling. Travel is shown only when NO vehicle can take it (none
// available, none booked, at least one travel-blocked). Travel is keyed
// strictly on block_reason, never on area.
//
// Area-specific travel: when the visitor's selected area equals a claimable
// travel tile's destination (`travel_going` OR `travel_returning`), that cell
// becomes `area-available` (bookable, red-orange gradient). Non-matching
// destinations stay `travel` (amber/unavailable). The tile's decayed
// promo_percent/promo_area are surfaced so the booking form can show the
// discount and the handler can persist it.
export function computeSlotStatus({ data, effectiveArea, slotStarts, timeToMin }) {
  const result = {};
  for (const slot of slotStarts) result[slot] = { status: "empty" };
  if (!data) return result;

  for (const slot of slotStarts) {
    const gridMin = timeToMin(slot);

    // 0) Advance — a future course on this vehicle already occupies the tile.
    //    Detected strictly on block_reason (never on area). Highest priority:
    //    the desktop publishes only one row per tile, so this is defensive for
    //    the cross-vehicle case, but it guarantees an advance_booked tile is
    //    never shown as bookable.
    const advanceEntries = (data.advanceSlots || []).filter(
      (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
    );
    if (advanceEntries.length > 0) {
      const advance = advanceEntries[0];
      result[slot] = {
        status: "advance",
        availableInDays: advance.availableInDays ?? null,
      };
      continue;
    }

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
    //    be found: a claimable tile (`travel_going` or `travel_returning`)
    //    whose destination equals the visitor's selected area becomes
    //    bookable (red-orange gradient), while non-matching destinations stay
    //    amber.
    const travelEntries = (data.travelSlots || []).filter(
      (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
    );
    if (travelEntries.length > 0) {
      const areaMatch = effectiveArea
        ? travelEntries.find(
            (s) =>
              (s.blockReason === "travel_going" ||
                s.blockReason === "travel_returning") &&
              normalizeArea(s.area) === normalizeArea(effectiveArea)
          )
        : null;
      if (areaMatch) {
        result[slot] = {
          status: "area-available",
          blockReason: areaMatch.blockReason,
          area: areaMatch.area,
          vehicleId: areaMatch.vehicleId,
          vehicleName: areaMatch.vehicleName,
          promoPercent: areaMatch.promoPercent ?? null,
          promoArea: areaMatch.promoArea ?? null,
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
