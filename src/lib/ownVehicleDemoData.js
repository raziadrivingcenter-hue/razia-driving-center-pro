// =============================================================================
// DEV-ONLY demo availability for the own-vehicle page.
// =============================================================================
// Loaded through a dynamic import inside `fetchOwnVehicleAvailability`, which
// is guarded by `import.meta.env.DEV && ?demo=1`. In a production build that
// guard is replaced with `false`, so this whole module is tree-shaken out.
//
// The pattern is fixed (not random) so the demo is predictable: it contains a
// mix of available, booked, traveling and advance tiles, several consecutive
// free pairs, and a few single free tiles that cannot host a 40–60 min lesson.
// =============================================================================

import { SLOT_STARTS, formatTime12 } from "./ownVehicleSlots.js";

// status per slot: available | booked | travel | advance
const PATTERN = {
  "07:00": "booked",
  "07:30": "available", // single — 08:00 is booked
  "08:00": "booked",
  "08:30": "travel",
  "09:00": "available", // single — 09:30 is booked
  "09:30": "booked",
  "10:00": "available", // pair with 10:30
  "10:30": "available",
  "11:00": "booked",
  "11:30": "available", // single — 12:00 is traveling
  "12:00": "travel",
  "12:30": "available", // pair with 13:00
  "13:00": "available",
  "13:30": "advance",
  "14:00": "available", // pair with 14:30
  "14:30": "available",
  "15:00": "booked",
  "15:30": "available", // single — 16:00 is booked
  "16:00": "booked",
  "16:30": "available", // pair with 17:00
  "17:00": "available",
  "17:30": "available", // pair with 18:00
  "18:00": "available",
  "18:30": "booked", // edge — no room for a second tile
};

const VEHICLES = [
  { id: 1, name: "Toyota Corolla" },
  { id: 2, name: "Honda City" },
];

function makeSlot(time, vehicleId, extra = {}) {
  const [h, m] = time.split(":").map(Number);
  const endMin = h * 60 + m + 30;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
    endMin % 60
  ).padStart(2, "0")}`;
  const vehicle = VEHICLES.find((v) => v.id === vehicleId);

  return {
    time,
    end,
    display: formatTime12(time),
    vehicleId,
    vehicleName: vehicle?.name || "",
    ...extra,
  };
}

// Build a fake fetchAvailability() payload for the given date.
export function buildDemoAvailability(date) {
  const availableSlots = [];
  const blockedSlots = [];
  const travelSlots = [];
  const advanceSlots = [];

  for (const slot of SLOT_STARTS) {
    const kind = PATTERN[slot];

    if (kind === "available") {
      availableSlots.push(
        makeSlot(slot, 1, { promoPercent: null, promoArea: null })
      );
    } else if (kind === "booked") {
      blockedSlots.push(makeSlot(slot, 1, { reason: "booked" }));
    } else if (kind === "travel") {
      travelSlots.push(
        makeSlot(slot, 1, {
          blockReason: "travel_going",
          area: "DHA",
          promoPercent: null,
          promoArea: null,
        })
      );
    } else if (kind === "advance") {
      advanceSlots.push(makeSlot(slot, 1, { availableInDays: 3 }));
    }
  }

  return {
    date,
    operatingHours: { start: "07:00", end: "19:00" },
    slotDurationMin: 30,
    availableSlots,
    blockedSlots,
    travelSlots,
    advanceSlots,
    vehicles: VEHICLES,
    synced: true,
    note: "Demo data — ?demo=1",
    totalSlots: SLOT_STARTS.length,
    availableCount: availableSlots.length,
    blockedCount: blockedSlots.length,
  };
}
