// =============================================================================
// Unit tests for the own-vehicle pricing engine.
// Run with:  node --test src/lib/ownVehiclePricing.test.js
// Uses only Node's built-in test runner — no new dependencies.
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_DAYS,
  MAX_DAYS,
  MIN_MINUTES,
  MAX_MINUTES,
  MINUTES_STEP,
  DAYS_STEP,
  BASE_MINUTES,
  BASE_PRICE_PER_DAY,
  ROUND_TO,
  PICKDROP_RATE_PER_KM,
  MAX_DISTANCE_KM,
  ROUND_TRIP_MULTIPLIER,
  perDayPrice,
  courseFee,
  totalHours,
  pickDropCharge,
  total,
  clampDays,
  clampMinutes,
  clampDistanceKm,
  validate,
  formatRs,
} from "./ownVehiclePricing.js";

// --- Constants --------------------------------------------------------------

test("constants match the agreed pricing configuration", () => {
  assert.equal(MIN_DAYS, 7);
  assert.equal(MAX_DAYS, 30);
  assert.equal(MIN_MINUTES, 30);
  assert.equal(MAX_MINUTES, 60);
  assert.equal(MINUTES_STEP, 10);
  assert.equal(DAYS_STEP, 1);
  assert.equal(BASE_MINUTES, 60);
  assert.equal(BASE_PRICE_PER_DAY, 1600);
  assert.equal(ROUND_TO, 10);
  assert.equal(PICKDROP_RATE_PER_KM, 65);
  assert.equal(MAX_DISTANCE_KM, 20);
  assert.equal(ROUND_TRIP_MULTIPLIER, 2);
});

// --- per-day price ----------------------------------------------------------

test("perDayPrice scales the 60-minute base rate", () => {
  assert.equal(perDayPrice(60), 1600);
  assert.equal(perDayPrice(30), 800);
  // 1600 × 40 / 60 = 1066.67 → rounded to the nearest 10.
  assert.equal(perDayPrice(40), 1070);
});

// --- Course fee -------------------------------------------------------------

test("courseFee = days × per-day price", () => {
  assert.equal(courseFee(7, 30), 5600);
  assert.equal(courseFee(10, 60), 16000);
  assert.equal(courseFee(10, 40), 10700);
});

// --- Total training hours ---------------------------------------------------

test("totalHours converts days × minutes into hours", () => {
  assert.equal(totalHours(10, 30), 5);
  assert.equal(totalHours(10, 60), 10);
  assert.equal(totalHours(7, 30), 3.5);
});

// --- Pick & drop ------------------------------------------------------------

test("pickDropCharge includes the round trip", () => {
  assert.equal(pickDropCharge(10, 8), 10400);
  assert.equal(pickDropCharge(30, 20), 78000);
});

test("pickDropCharge clamps distance above the 20 km limit", () => {
  assert.equal(pickDropCharge(10, 25), pickDropCharge(10, 20));
  assert.equal(pickDropCharge(10, 25), 26000);
});

test("clampDistanceKm keeps distance inside 0..20", () => {
  assert.equal(clampDistanceKm(-5), 0);
  assert.equal(clampDistanceKm(0), 0);
  assert.equal(clampDistanceKm(8), 8);
  assert.equal(clampDistanceKm(20), 20);
  assert.equal(clampDistanceKm(99), 20);
});

// --- Grand total ------------------------------------------------------------

test("total combines course fee and pick & drop", () => {
  assert.equal(total(7, 30, 0, false), 5600);
  assert.equal(total(10, 60, 0, false), 16000);
  assert.equal(total(10, 60, 8, true), 26400);
  assert.equal(total(30, 60, 20, true), 126000);
  assert.equal(total(10, 40, 0, false), 10700);
});

test("homeService = false never adds a pick & drop charge", () => {
  assert.equal(total(10, 60, 20, false), 16000);
});

// --- Clamping and snapping --------------------------------------------------

test("clampDays snaps to whole days and stays inside 7..30", () => {
  assert.equal(clampDays(5), 7);
  assert.equal(clampDays(7), 7);
  assert.equal(clampDays(12), 12);
  assert.equal(clampDays(30), 30);
  assert.equal(clampDays(40), 30);
});

test("clampMinutes snaps to the 10-minute step and stays inside 30..60", () => {
  assert.equal(clampMinutes(25), 30);
  assert.equal(clampMinutes(28), 30);
  assert.equal(clampMinutes(52), 50);
  assert.equal(clampMinutes(55), 60);
  assert.equal(clampMinutes(57), 60);
  assert.equal(clampMinutes(90), 60);
});

// --- Validation -------------------------------------------------------------

test("validate returns no errors for a valid course", () => {
  assert.deepEqual(validate({ days: 10, minutes: 60, distanceKm: 8, homeService: true }), {});
  assert.deepEqual(validate({ days: 7, minutes: 30, distanceKm: 0, homeService: false }), {});
});

test("validate flags out-of-range days and minutes", () => {
  const errors = validate({ days: 5, minutes: 20, distanceKm: 0, homeService: false });

  assert.ok(errors.days);
  assert.ok(errors.minutes);
});

test("validate only checks distance when home service is on", () => {
  assert.deepEqual(
    validate({ days: 10, minutes: 60, distanceKm: 0, homeService: false }),
    {}
  );

  const errors = validate({ days: 10, minutes: 60, distanceKm: 0, homeService: true });
  assert.ok(errors.distanceKm);
});

test("validate accepts positional arguments too", () => {
  assert.deepEqual(validate(10, 60, 8, true), {});
  assert.ok(validate(5, 60, 8, true).days);
});

// --- Formatting -------------------------------------------------------------

test("formatRs groups thousands", () => {
  assert.equal(formatRs(1600), "Rs. 1,600");
  assert.equal(formatRs(16000), "Rs. 16,000");
  assert.equal(formatRs(126000), "Rs. 126,000");
});
