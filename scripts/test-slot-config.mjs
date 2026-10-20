// =============================================================================
// Regression tests: slotConfig.js — the canonical operating-hours + slot logic.
// Pure logic only — no network, no Supabase. Safe to run locally anytime.
//   node scripts/test-slot-config.mjs
//
// These guard the confirmed business rule:
//   Training hours 07:00–19:00, 30-min slots, last bookable start 18:30.
// The old inconsistency was 08:00–20:00 / 60-min — these tests assert the
// corrected values and the boundary behavior the booking endpoints now enforce.
// =============================================================================

import {
  OPERATING_HOURS,
  SLOT_DURATION_MIN,
  MAX_DISTANCE_KM,
  RATE_PER_KM,
  PLUS_FREE_KM,
  LAST_SLOT_START,
  validateSlotTime,
  generateSlotStarts,
} from "../functions/lib/slotConfig.js";

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

function eq(name, actual, expected) {
  const ok = actual === expected;
  check(name, ok, ok ? undefined : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log("=== Slot Config Regression Tests ===\n");

// ── Test 1: canonical operating hours ──────────────────────────────────────
console.log("Test 1: canonical operating hours");
eq("opening is 07:00", OPERATING_HOURS.start, "07:00");
eq("closing is 19:00", OPERATING_HOURS.end, "19:00");
eq("slot duration is 30 min", SLOT_DURATION_MIN, 30);
eq("last slot start is 18:30", LAST_SLOT_START, "18:30");

// ── Test 2: slot grid covers the full operating day ────────────────────────
console.log("\nTest 2: generated slot grid");
const starts = generateSlotStarts();
eq("24 half-hour slots", starts.length, 24);
eq("first slot is 07:00", starts[0], "07:00");
eq("last slot is 18:30", starts[starts.length - 1], "18:30");
check("every slot is HH:00 or HH:30", starts.every((s) => /^\d{2}:(00|30)$/.test(s)), "boundary drift");
check("all slots within operating hours", starts.every((s) => s >= "07:00" && s <= "18:30"), "out-of-range slot");
// Verify contiguous 30-min steps (no gaps, no duplicates)
let contiguous = true;
for (let i = 1; i < starts.length; i++) {
  const prev = starts[i - 1].split(":").reduce((a, v) => a * 60 + Number(v), 0);
  const cur = starts[i].split(":").reduce((a, v) => a * 60 + Number(v), 0);
  if (cur - prev !== 30) contiguous = false;
}
check("slots are contiguous 30-min steps", contiguous, "gap or duplicate detected");

// ── Test 3: validateSlotTime — valid boundary times ───────────────────────
console.log("\nTest 3: valid boundary times accepted");
check("07:00 (opening) ok", validateSlotTime("07:00").ok);
check("18:30 (last start) ok", validateSlotTime("18:30").ok);
check("12:00 (midday) ok", validateSlotTime("12:00").ok);
check("15:30 (half-hour) ok", validateSlotTime("15:30").ok);
check("HH:MM:SS format ok", validateSlotTime("09:30:00").ok);

// ── Test 4: validateSlotTime — rejected outside operating hours ────────────
console.log("\nTest 4: times outside operating hours rejected");
check("06:59 rejected (before opening)", !validateSlotTime("06:59").ok);
check("06:00 rejected", !validateSlotTime("06:00").ok);
check("19:00 rejected (would run past closing)", !validateSlotTime("19:00").ok);
check("20:00 rejected (old incorrect closing)", !validateSlotTime("20:00").ok);
check("22:00 rejected", !validateSlotTime("22:00").ok);
check("00:00 rejected", !validateSlotTime("00:00").ok);

// ── Test 5: validateSlotTime — rejected off 30-min boundary ────────────────
console.log("\nTest 5: off-boundary minutes rejected");
check("07:15 rejected", !validateSlotTime("07:15").ok);
check("10:45 rejected", !validateSlotTime("10:45").ok);
check("14:01 rejected", !validateSlotTime("14:01").ok);
check("18:59 rejected", !validateSlotTime("18:59").ok);

// ── Test 6: validateSlotTime — malformed / empty input ─────────────────────
console.log("\nTest 6: malformed input rejected");
check("null rejected", !validateSlotTime(null).ok);
check("undefined rejected", !validateSlotTime(undefined).ok);
check("empty string rejected", !validateSlotTime("").ok);
check("'abc' rejected", !validateSlotTime("abc").ok);
check("'8:00' (no leading zero) rejected", !validateSlotTime("8:00").ok);
check("'25:00' rejected (bad hour)", !validateSlotTime("25:00").ok);
check("'12:60' rejected (bad minute)", !validateSlotTime("12:60").ok);

// ── Test 7: error messages are descriptive ─────────────────────────────────
console.log("\nTest 7: error messages are descriptive");
check("before-opening error mentions 07:00", /07:00/.test(validateSlotTime("06:00").error));
check("after-closing error mentions 18:30", /18:30/.test(validateSlotTime("19:00").error));
check("off-boundary error mentions hour/half-hour", /hour or half-hour/.test(validateSlotTime("07:15").error));
check("malformed error mentions HH:MM", /HH:MM/.test(validateSlotTime("abc").error));

// ── Test 8: constants match the confirmed business rule ────────────────────
console.log("\nTest 8: business-rule constants");
eq("max distance 20 KM", MAX_DISTANCE_KM, 20);
eq("rate per KM is 50", RATE_PER_KM, 50);
eq("PLUS first 2 KM free", PLUS_FREE_KM, 2);
// Closing minus opening = 12 hours = 720 min = 24 × 30-min slots
eq("operating window is 12 hours",
  (Number(OPERATING_HOURS.end.split(":")[0]) * 60 + Number(OPERATING_HOURS.end.split(":")[1])) -
  (Number(OPERATING_HOURS.start.split(":")[0]) * 60 + Number(OPERATING_HOURS.start.split(":")[1])),
  720);
eq("slots fit exactly: 720 / 30 = 24", 720 / SLOT_DURATION_MIN, 24);

// ── Test 9: no regression to the old incorrect values ─────────────────────
console.log("\nTest 9: old incorrect values are gone");
check("opening is NOT 08:00", OPERATING_HOURS.start !== "08:00");
check("closing is NOT 20:00", OPERATING_HOURS.end !== "20:00");
check("slot duration is NOT 60", SLOT_DURATION_MIN !== 60);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
