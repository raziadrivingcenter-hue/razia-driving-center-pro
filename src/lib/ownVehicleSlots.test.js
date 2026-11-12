// =============================================================================
// Unit tests for the own-vehicle slot selection logic.
// Run with:  node --test src/lib/ownVehicleSlots.test.js
// Uses only Node's built-in test runner — no new dependencies.
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
  SLOT_STARTS,
  addMinutes,
  formatTimeRange,
  isSelectableStart,
  lessonRange,
  rangeSlots,
  slotsByPeriod,
  tilesNeeded,
} from "./ownVehicleSlots.js";
import { computeSlotStatus } from "../components/SlotAvailability/slotStatusLogic.js";

const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Build a status map directly, the same shape computeSlotStatus returns.
const statusMap = ({ available = [], booked = [], travel = [], advance = [] } = {}) => {
  const map = {};
  for (const slot of SLOT_STARTS) map[slot] = { status: "empty" };
  for (const slot of available) map[slot] = { status: "available" };
  for (const slot of booked) map[slot] = { status: "booked" };
  for (const slot of travel) map[slot] = { status: "travel" };
  for (const slot of advance) map[slot] = { status: "advance" };
  return map;
};

// ── Lesson length → tile count ────────────────────────────────────────────────

test("tilesNeeded maps 30/40/50/60 minutes to tile counts", () => {
  assert.equal(tilesNeeded(30), 1);
  assert.equal(tilesNeeded(40), 2);
  assert.equal(tilesNeeded(50), 2);
  assert.equal(tilesNeeded(60), 2);
});

test("tilesNeeded never drops below one tile", () => {
  assert.equal(tilesNeeded(0), 1);
  assert.equal(tilesNeeded(15), 1);
});

// ── Consecutive-tile logic ────────────────────────────────────────────────────

test("30 minutes: a single available tile is selectable", () => {
  const status = statusMap({ available: ["16:00"] });
  assert.equal(isSelectableStart("16:00", status, 1), true);
});

test("40/50/60 minutes: start tile needs the next tile free too", () => {
  const status = statusMap({ available: ["16:00", "16:30"] });
  assert.equal(isSelectableStart("16:00", status, 2), true);
  // 16:30 would need 17:00, which is empty.
  assert.equal(isSelectableStart("16:30", status, 2), false);
});

test("blocked neighbour makes the start tile unselectable", () => {
  const status = statusMap({ available: ["16:00"], booked: ["16:30"] });
  assert.equal(isSelectableStart("16:00", status, 2), false);
});

test("travel neighbour makes the start tile unselectable", () => {
  const status = statusMap({ available: ["16:00"], travel: ["16:30"] });
  assert.equal(isSelectableStart("16:00", status, 2), false);
});

test("advance neighbour makes the start tile unselectable", () => {
  const status = statusMap({ available: ["16:00"], advance: ["16:30"] });
  assert.equal(isSelectableStart("16:00", status, 2), false);
});

test("edge at 18:30: one tile fits, two tiles run past closing", () => {
  const status = statusMap({ available: ["18:30"] });
  assert.equal(isSelectableStart("18:30", status, 1), true);
  assert.equal(isSelectableStart("18:30", status, 2), false);
});

test("a free pair in the evening: 17:30 works for two tiles, 18:00 does not", () => {
  const status = statusMap({ available: ["17:30", "18:00"] });
  assert.equal(isSelectableStart("17:30", status, 2), true);
  assert.equal(isSelectableStart("18:00", status, 2), false);
});

test("rangeSlots returns the covered tiles and stops at end of day", () => {
  assert.deepEqual(rangeSlots("16:00", 2), ["16:00", "16:30"]);
  assert.deepEqual(rangeSlots("18:30", 2), ["18:30"]);
  assert.deepEqual(rangeSlots("18:30", 1), ["18:30"]);
});

// ── Lesson clock range ──────────────────────────────────────────────────────
// The summary must show when the lesson ENDS, not the start of its last tile.

test("lessonRange spans the first tile's start to the END of the last tile", () => {
  assert.deepEqual(lessonRange("16:00", 1), { start: "16:00", end: "16:30" });
  assert.deepEqual(lessonRange("16:00", 2), { start: "16:00", end: "17:00" });
  assert.deepEqual(lessonRange("18:30", 1), { start: "18:30", end: "19:00" });
});

test("lessonRange stops at closing time rather than inventing a tile", () => {
  // Only one tile fits at 18:30, so a 2-tile lesson cannot start there.
  assert.deepEqual(lessonRange("18:30", 2), { start: "18:30", end: "19:00" });
});

test("addMinutes wraps past midnight", () => {
  assert.equal(addMinutes("23:45", 30), "00:15");
  assert.equal(addMinutes("10:00", 0), "10:00");
});

// ── Status mapping for a travel tile ──────────────────────────────────────────

test("computeSlotStatus with no area keeps travel non-selectable", () => {
  const data = {
    travelSlots: [
      {
        time: "16:00",
        end: "16:30",
        blockReason: "travel_going",
        area: "DHA",
      },
    ],
  };
  const status = computeSlotStatus({
    data,
    effectiveArea: "",
    slotStarts: ["16:00"],
    timeToMin,
  });

  assert.equal(status["16:00"].status, "travel");
  assert.equal(isSelectableStart("16:00", status, 1), false);
});

test("a travel tile is not selectable even when it is the only free-looking cell", () => {
  const status = statusMap({ travel: ["12:30"] });
  assert.equal(isSelectableStart("12:30", status, 1), false);
});

// ── Period layout ─────────────────────────────────────────────────────────────

test("period columns hold 10 / 10 / 4 rows", () => {
  const periods = slotsByPeriod();
  assert.equal(periods[0].key, "morning");
  assert.equal(periods[0].slots.length, 10);
  assert.equal(periods[1].key, "afternoon");
  assert.equal(periods[1].slots.length, 10);
  assert.equal(periods[2].key, "evening");
  assert.equal(periods[2].slots.length, 4);
});

test("every slot appears in exactly one period", () => {
  const periods = slotsByPeriod();
  const all = periods.flatMap((p) => p.slots);
  assert.equal(all.length, SLOT_STARTS.length);
  assert.deepEqual([...all].sort(), [...SLOT_STARTS].sort());
});

// ── Time formatting ───────────────────────────────────────────────────────────

test("formatTimeRange drops the shared AM/PM suffix", () => {
  assert.equal(formatTimeRange("16:00", "17:00"), "4:00 to 5:00 PM");
  assert.equal(formatTimeRange("10:00", "11:00"), "10:00 to 11:00 AM");
});

test("formatTimeRange keeps both suffixes when they differ", () => {
  assert.equal(formatTimeRange("11:30", "12:30"), "11:30 AM to 12:30 PM");
});
