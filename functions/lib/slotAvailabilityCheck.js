/* ------------------------------------------------------------------ */
/*  Shared slot-availability gate.                                     */
/*                                                                    */
/*  Mirrors the pre-check in functions/api/v1/slot-booking.js. It is a  */
/*  READ-ONLY duplicate by design: the live booking endpoint is left     */
/*  untouched, because changing it is a separate, riskier change. The   */
/*  payment path needs the same gate so a forged checkout cannot claim   */
/*  a slot the website shows as unavailable.                            */
/*                                                                    */
/*  The exact vehicle is derived here from Supabase — NEVER from the     */
/*  browser. The atomic guard against two live checkouts on one slot is  */
/*  the unique partial index on booking_slot_holds (see migration 011).  */
/* ------------------------------------------------------------------ */

// Area comparison key: trim, lowercase, collapse whitespace. Deliberately NO
// aliasing — "Shadman" and "Shadman 1" are not equivalent.
export function normalizeAreaKey(a) {
  return String(a || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeTime(value) {
  const m = String(value || "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/**
 * Check whether a slot may be booked.
 *
 * @param {{ fetchImpl?: Function, supabaseUrl: string, anonKey: string,
 *           date: string, time: string, area?: string }} args
 * @returns {Promise<
 *   | { ok: true, travelBooking: boolean, vehicleId: number|null,
 *       vehicleName: string|null, area: string|null, promoPercent: number|null }
 *   | { ok: false, status: number, error: string }
 * >}
 */
export async function checkSlotAvailability({
  fetchImpl = fetch,
  supabaseUrl,
  anonKey,
  date,
  time,
  area = "",
}) {
  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 500, error: "Booking service not configured" };
  }

  const normalizedTime = normalizeTime(time);
  let travelBooking = false;
  let resolvedVehicleId = null;
  let resolvedVehicleName = null;
  let resolvedArea = area || null;
  let resolvedPromoPercent = null;

  const query =
    `${supabaseUrl}/rest/v1/slot_availability` +
    `?slot_date=eq.${encodeURIComponent(date)}` +
    `&select=slot_start,status,vehicle_id,vehicle_name,block_reason,area,promo_percent,promo_area` +
    `&order=vehicle_id.asc`;

  let slotRows;
  try {
    const res = await fetchImpl(query, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) {
      console.error("Slot availability lookup failed:", res.status);
      return {
        ok: false,
        status: 503,
        error:
          "We could not verify this slot. Please go back and pick another time, or try again shortly.",
      };
    }
    slotRows = await res.json();
  } catch (error) {
    console.error("Slot availability lookup error:", error);
    return {
      ok: false,
      status: 503,
      error: "We could not verify this slot. Please try again shortly.",
    };
  }

  const timeMatches = (Array.isArray(slotRows) ? slotRows : []).filter(
    (s) => String(s.slot_start || "").slice(0, 5) === normalizedTime
  );

  // Advance-booked tiles are NEVER bookable. Checked before the available-row
  // lookup so the advance rule cannot be bypassed.
  const advanceRow = timeMatches.find(
    (s) => s.status === "blocked" && s.block_reason === "advance_booked"
  );
  if (advanceRow) {
    return {
      ok: false,
      status: 409,
      error: "This slot is booked in advance. Please go back and pick another time.",
    };
  }

  const availableRow = timeMatches.find((s) => s.status === "available");
  if (availableRow) {
    // Normal booking.
  } else if (area) {
    // Area-specific travel booking: a claimable travel tile whose destination
    // matches the selected area. Lowest vehicle_id wins (deterministic).
    const claimableTravel = timeMatches
      .filter(
        (s) =>
          s.status === "blocked" &&
          (s.block_reason === "travel_going" || s.block_reason === "travel_returning")
      )
      .sort((a, b) => (a.vehicle_id ?? 0) - (b.vehicle_id ?? 0));
    const areaMatch = claimableTravel.find(
      (s) => normalizeAreaKey(s.area) === normalizeAreaKey(area)
    );
    if (areaMatch) {
      travelBooking = true;
      resolvedVehicleId = areaMatch.vehicle_id ?? null;
      resolvedVehicleName = areaMatch.vehicle_name ?? null;
      resolvedArea = (areaMatch.area || area || "").trim() || null;
      if (
        areaMatch.promo_percent != null &&
        normalizeAreaKey(areaMatch.promo_area) === normalizeAreaKey(area)
      ) {
        const parsed = Math.round(Number(areaMatch.promo_percent));
        if (Number.isFinite(parsed) && parsed > 0) {
          resolvedPromoPercent = Math.min(100, parsed);
        }
      }
    } else if (claimableTravel.length > 0) {
      const destinations = [
        ...new Set(claimableTravel.map((s) => s.area).filter(Boolean)),
      ];
      return {
        ok: false,
        status: 409,
        error: destinations.length
          ? `This slot is only available for ${destinations.join(", ")}.`
          : "This slot is not available for your selected area.",
      };
    }
  }

  if (!availableRow && !travelBooking) {
    return {
      ok: false,
      status: 409,
      error: "This slot is no longer available. Please go back and pick another time.",
    };
  }

  return {
    ok: true,
    travelBooking,
    vehicleId: resolvedVehicleId,
    vehicleName: resolvedVehicleName,
    area: resolvedArea,
    promoPercent: resolvedPromoPercent,
  };
}
