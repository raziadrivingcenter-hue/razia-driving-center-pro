// Pure-logic tests for the slot-grid status aggregation — run with:
//   node --test src/components/SlotAvailability/slotStatusLogic.test.js
import { test } from "node:test";
import assert from "node:assert";
import { computeSlotStatus, normalizeArea } from "./slotStatusLogic.js";

const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const SLOTS = ["14:00", "14:30", "15:00"];

const travel = (over = {}) => ({
  time: "14:00",
  end: "14:30",
  blockReason: "travel_going",
  area: "Shadman",
  vehicleId: 3,
  vehicleName: "Toyota Corolla",
  ...over,
});

const advance = (over = {}) => ({
  time: "14:00",
  end: "14:30",
  availableInDays: 3,
  vehicleId: 9007,
  vehicleName: "Toyota Corolla",
  ...over,
});

const status = (data, effectiveArea) =>
  computeSlotStatus({ data, effectiveArea, slotStarts: SLOTS, timeToMin });

// ── normalizeArea ────────────────────────────────────────────────────────────

test("normalizeArea trims, lowercases and collapses whitespace", () => {
  assert.strictEqual(normalizeArea("  SHADMAN   Town "), "shadman town");
  assert.strictEqual(normalizeArea("Shadman"), "shadman");
});

test("normalizeArea handles null/undefined/empty", () => {
  assert.strictEqual(normalizeArea(null), "");
  assert.strictEqual(normalizeArea(undefined), "");
  assert.strictEqual(normalizeArea(""), "");
});

// ── area-specific travel ─────────────────────────────────────────────────────

test("matching travel_going area becomes area-available", () => {
  const s = status({ travelSlots: [travel()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].blockReason, "travel_going");
  assert.strictEqual(s["14:00"].area, "Shadman");
  assert.strictEqual(s["14:00"].vehicleId, 3);
  assert.strictEqual(s["14:00"].vehicleName, "Toyota Corolla");
});

test("area matching is case-insensitive and whitespace-normalized", () => {
  const s = status({ travelSlots: [travel({ area: "  SHADMAN  " })] }, "shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
});

test("different area stays travel (unavailable)", () => {
  const s = status({ travelSlots: [travel()] }, "DHA");
  assert.strictEqual(s["14:00"].status, "travel");
  assert.strictEqual(s["14:00"].blockReason, "travel_going");
});

test("'Shadman' does NOT match 'Shadman 1' (no aliasing)", () => {
  const s = status({ travelSlots: [travel({ area: "Shadman 1" })] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "travel");
});

test("matching travel_returning area becomes area-available", () => {
  const s = status({ travelSlots: [travel({ blockReason: "travel_returning" })] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].blockReason, "travel_returning");
  assert.strictEqual(s["14:00"].area, "Shadman");
});

test("travel_returning with a different area stays travel", () => {
  const s = status({ travelSlots: [travel({ blockReason: "travel_returning" })] }, "DHA");
  assert.strictEqual(s["14:00"].status, "travel");
  assert.strictEqual(s["14:00"].blockReason, "travel_returning");
});

test("area-available surfaces the tile's decayed promo", () => {
  const s = status(
    {
      travelSlots: [
        travel({ blockReason: "travel_returning", promoPercent: 8, promoArea: "Shadman" }),
      ],
    },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].promoPercent, 8);
  assert.strictEqual(s["14:00"].promoArea, "Shadman");
});

test("area-available surfaces the promo for travel_going too", () => {
  // Both claimable directions must carry the row's promo_percent through to
  // the booking form ("{percent}% off pick & drop").
  const s = status(
    {
      travelSlots: [
        travel({ blockReason: "travel_going", promoPercent: 12, promoArea: "Shadman" }),
      ],
    },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].blockReason, "travel_going");
  assert.strictEqual(s["14:00"].promoPercent, 12);
  assert.strictEqual(s["14:00"].promoArea, "Shadman");
});

test("area-available promo is null when the tile carries none", () => {
  const s = status({ travelSlots: [travel()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].promoPercent, null);
  assert.strictEqual(s["14:00"].promoArea, null);
});

test("no area selected → travel stays travel", () => {
  const s = status({ travelSlots: [travel()] }, "");
  assert.strictEqual(s["14:00"].status, "travel");
});

test("area match only applies to the matching time cell", () => {
  const s = status({ travelSlots: [travel()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:30"].status, "empty");
});

// ── advance-booked tiles ────────────────────────────────────────────────────

test("advance tile is not selectable and surfaces available_in_days", () => {
  const s = status({ advanceSlots: [advance()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "advance");
  assert.strictEqual(s["14:00"].availableInDays, 3);
});

test("advance tile with no available_in_days still renders (null)", () => {
  const s = status({ advanceSlots: [advance({ availableInDays: null })] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "advance");
  assert.strictEqual(s["14:00"].availableInDays, null);
});

test("advance tile is not selectable regardless of area", () => {
  // Detection is keyed on block_reason only — the area never matters.
  for (const effectiveArea of ["Shadman", "DHA", ""]) {
    const s = status({ advanceSlots: [advance()] }, effectiveArea);
    assert.strictEqual(s["14:00"].status, "advance", `area "${effectiveArea}"`);
  }
});

test("same-area travel tile is still selectable (unaffected by advance logic)", () => {
  const s = status({ travelSlots: [travel()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "area-available");
  assert.strictEqual(s["14:00"].blockReason, "travel_going");
});

test("available tile wins over an advance_booked row", () => {
  // A free vehicle is bookable, so it must not be hidden behind advance.
  const s = status(
    {
      availableSlots: [{ time: "14:00", end: "14:30" }],
      advanceSlots: [advance()],
    },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "available");
});

test("advance only affects its own time cell", () => {
  const s = status({ advanceSlots: [advance()] }, "Shadman");
  assert.strictEqual(s["14:00"].status, "advance");
  assert.strictEqual(s["14:30"].status, "empty");
});

test("travel tile wins over an advance_booked row", () => {
  // A claimable travel tile is bookable for its area, so advance must not
  // hide it.
  const s = status(
    { travelSlots: [travel()], advanceSlots: [advance()] },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "area-available");
});

// ── existing statuses are preserved ──────────────────────────────────────────

test("normal available slot still wins over a travel tile", () => {
  const s = status(
    { availableSlots: [{ time: "14:00", end: "14:30" }], travelSlots: [travel()] },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "available");
});

test("booked still wins over a travel tile", () => {
  const s = status(
    { blockedSlots: [{ time: "14:00", end: "14:30" }], travelSlots: [travel()] },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "booked");
});

test("empty cell when no records cover it", () => {
  const s = status({ travelSlots: [travel()] }, "Shadman");
  assert.strictEqual(s["15:00"].status, "empty");
});

test("no data → every cell empty", () => {
  const s = status(null, "Shadman");
  for (const slot of SLOTS) assert.strictEqual(s[slot].status, "empty");
});

test("available surfaces promo info when present", () => {
  const s = status(
    {
      availableSlots: [
        { time: "14:00", end: "14:30", promoPercent: 10, promoArea: "Shadman" },
      ],
    },
    "Shadman"
  );
  assert.strictEqual(s["14:00"].status, "available");
  assert.strictEqual(s["14:00"].promoPercent, 10);
  assert.strictEqual(s["14:00"].promoArea, "Shadman");
});
