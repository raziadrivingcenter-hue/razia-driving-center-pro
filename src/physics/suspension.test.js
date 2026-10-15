// Unit tests for pure visual-suspension maths — run with: node --test
import { test } from "node:test";
import assert from "node:assert";
import {
  clamp,
  dampSpring,
  computeBodyRoll,
  computeBodyPitch,
  suspensionOffsets,
  SUSPENSION_PARAMS,
} from "./suspension.js";

const P = SUSPENSION_PARAMS;

/* ── helpers ── */

// Simulate damping for N frames at 60fps and return the final value.
function dampFor(current, target, rate, frames, dt = 1 / 60) {
  let v = current;
  for (let i = 0; i < frames; i++) v = dampSpring(v, target, rate, dt);
  return v;
}

/* ── clamp & dampSpring ── */

test("clamp bounds values", () => {
  assert.strictEqual(clamp(5, -1, 1), 1);
  assert.strictEqual(clamp(-5, -1, 1), -1);
  assert.strictEqual(clamp(0.5, -1, 1), 0.5);
});

test("dampSpring converges toward target", () => {
  const v = dampFor(0, 1, 5, 600); // 10 seconds
  assert.ok(Math.abs(v - 1) < 0.001, `should converge to 1, got ${v}`);
});

test("dampSpring does not overshoot", () => {
  let v = 0;
  for (let i = 0; i < 600; i++) {
    v = dampSpring(v, 1, 5, 1 / 60);
    assert.ok(v <= 1.0001, `must not overshoot target, got ${v} at frame ${i}`);
    assert.ok(v >= -0.0001, `must stay above start, got ${v} at frame ${i}`);
  }
});

test("dampSpring returns current when dt is zero or negative", () => {
  assert.strictEqual(dampSpring(0.3, 1, 5, 0), 0.3);
  assert.strictEqual(dampSpring(0.3, 1, 5, -1), 0.3);
});

/* ── body roll ── */

test("left turn and right turn produce opposite roll", () => {
  // Right turn: lateralAccel < 0 → roll < 0 (leans left).
  // Left turn:  lateralAccel > 0 → roll > 0 (leans right).
  const rightTurn = computeBodyRoll(-2);
  const leftTurn = computeBodyRoll(2);
  assert.ok(rightTurn < 0, "right turn should produce negative roll (lean left)");
  assert.ok(leftTurn > 0, "left turn should produce positive roll (lean right)");
  assert.ok(Math.abs(rightTurn) === Math.abs(leftTurn),
    "equal-magnitude lateral accel should produce equal-magnitude roll");
});

test("body roll increases smoothly with lateral acceleration magnitude", () => {
  const r1 = Math.abs(computeBodyRoll(1));
  const r2 = Math.abs(computeBodyRoll(2));
  const r3 = Math.abs(computeBodyRoll(3));
  assert.ok(r1 < r2, "roll should grow as lateral accel grows");
  assert.ok(r2 < r3, "roll should grow monotonically");
});

test("body roll is clamped to maxRoll", () => {
  const huge = computeBodyRoll(1000);
  assert.ok(Math.abs(huge) <= P.maxRoll + 1e-9,
    `roll must not exceed maxRoll (${P.maxRoll}), got ${huge}`);
});

test("zero lateral acceleration produces zero roll", () => {
  assert.strictEqual(computeBodyRoll(0), 0);
});

/* ── body pitch ── */

test("acceleration and braking produce opposite pitch directions", () => {
  // Acceleration: longAccel > 0 → nose rises → pitch < 0.
  // Braking:      longAccel < 0 → nose dives → pitch > 0.
  const accel = computeBodyPitch(3);
  const brake = computeBodyPitch(-3);
  assert.ok(accel < 0, "acceleration should produce negative pitch (nose up)");
  assert.ok(brake > 0, "braking should produce positive pitch (nose down)");
  assert.strictEqual(accel, -brake, "symmetric accel/brake should give symmetric pitch");
});

test("acceleration produces nose-up (negative) pitch", () => {
  // The key regression: accel must NOT pitch the nose down.
  const p = computeBodyPitch(5);
  assert.ok(p < 0, "accelerating forward must raise the nose (negative pitch)");
});

test("braking produces nose-down (positive) pitch", () => {
  const p = computeBodyPitch(-5);
  assert.ok(p > 0, "braking must dip the nose (positive pitch)");
});

test("body pitch is clamped to maxPitch", () => {
  const huge = computeBodyPitch(10000);
  assert.ok(Math.abs(huge) <= P.maxPitch + 1e-9,
    `pitch must not exceed maxPitch (${P.maxPitch}), got ${huge}`);
});

test("zero longitudinal acceleration produces zero pitch", () => {
  assert.strictEqual(computeBodyPitch(0), 0);
});

/* ── per-wheel suspension offsets ── */

test("acceleration compresses rear, extends front", () => {
  // Forward accel (longAccel > 0): rear wheels move up (+), front move down (-).
  const o = suspensionOffsets(4, 0);
  assert.ok(o.RL > 0 && o.RR > 0, "rear wheels should compress under acceleration");
  assert.ok(o.FL < 0 && o.FR < 0, "front wheels should extend under acceleration");
  assert.strictEqual(o.RL, o.RR, "rear left/right equal under pure longitudinal accel");
  assert.strictEqual(o.FL, o.FR, "front left/right equal under pure longitudinal accel");
});

test("braking compresses front, extends rear", () => {
  // Braking (longAccel < 0): front compresses (+), rear extends (-).
  const o = suspensionOffsets(-4, 0);
  assert.ok(o.FL > 0 && o.FR > 0, "front wheels should compress under braking");
  assert.ok(o.RL < 0 && o.RR < 0, "rear wheels should extend under braking");
});

test("right turn compresses left wheels, extends right wheels", () => {
  // Right turn: lateralAccel < 0 → left side compresses (+), right extends (-).
  const o = suspensionOffsets(0, -3);
  assert.ok(o.FL > 0 && o.RL > 0, "left wheels should compress in a right turn");
  assert.ok(o.FR < 0 && o.RR < 0, "right wheels should extend in a right turn");
});

test("left turn compresses right wheels, extends left wheels", () => {
  // Left turn: lateralAccel > 0 → right compresses (+), left extends (-).
  const o = suspensionOffsets(0, 3);
  assert.ok(o.FR > 0 && o.RR > 0, "right wheels should compress in a left turn");
  assert.ok(o.FL < 0 && o.RL < 0, "left wheels should extend in a left turn");
});

test("suspension offsets combine longitudinal and lateral", () => {
  // Hard accel + right turn: rear-left gets both compressions (largest +),
  // front-right gets both extensions (largest -).
  const o = suspensionOffsets(4, -3);
  const max = Math.max(o.FL, o.FR, o.RL, o.RR);
  const min = Math.min(o.FL, o.FR, o.RL, o.RR);
  assert.strictEqual(max, o.RL, "rear-left should be most compressed (accel + right turn)");
  assert.strictEqual(min, o.FR, "front-right should be most extended (accel + right turn)");
});

test("suspension offsets are bounded by maxTravel", () => {
  const o = suspensionOffsets(1000, 1000);
  for (const [k, v] of Object.entries(o)) {
    assert.ok(Math.abs(v) <= P.maxTravel + 1e-9,
      `${k} offset ${v} must not exceed maxTravel ${P.maxTravel}`);
  }
});

test("zero acceleration produces zero suspension offsets", () => {
  const o = suspensionOffsets(0, 0);
  assert.strictEqual(o.FL, 0);
  assert.strictEqual(o.FR, 0);
  assert.strictEqual(o.RL, 0);
  assert.strictEqual(o.RR, 0);
});

/* ── full pipeline: effects settle to neutral when stopped ── */

test("roll settles to zero when lateral acceleration stops", () => {
  // Build up roll under lateral accel, then remove accel and damp.
  let roll = dampFor(0, computeBodyRoll(-3), P.rollResponse, 30);
  assert.ok(Math.abs(roll) > 0.001, "roll should be non-zero while cornering");
  roll = dampFor(roll, computeBodyRoll(0), P.rollResponse, 600);
  assert.ok(Math.abs(roll) < 0.001, `roll should settle to ~0, got ${roll}`);
});

test("pitch settles to zero when acceleration stops", () => {
  let pitch = dampFor(0, computeBodyPitch(5), P.pitchResponse, 30);
  assert.ok(Math.abs(pitch) > 0.001, "pitch should be non-zero while accelerating");
  pitch = dampFor(pitch, computeBodyPitch(0), P.pitchResponse, 600);
  assert.ok(Math.abs(pitch) < 0.001, `pitch should settle to ~0, got ${pitch}`);
});

test("suspension offsets settle to neutral when acceleration stops", () => {
  const dt = 1 / 60;
  let off = { FL: 0, FR: 0, RL: 0, RR: 0 };
  const target = suspensionOffsets(4, -2);
  for (let i = 0; i < 30; i++) {
    for (const k of ["FL", "FR", "RL", "RR"])
      off[k] = dampSpring(off[k], target[k], P.susResponse, dt);
  }
  // Now remove accel.
  const neutral = suspensionOffsets(0, 0);
  for (let i = 0; i < 600; i++) {
    for (const k of ["FL", "FR", "RL", "RR"])
      off[k] = dampSpring(off[k], neutral[k], P.susResponse, dt);
  }
  for (const [k, v] of Object.entries(off)) {
    assert.ok(Math.abs(v) < 0.001, `${k} should settle to ~0, got ${v}`);
  }
});

/* ── bounds never exceeded through damping ── */

test("damped roll never exceeds maxRoll even from a huge step", () => {
  const target = computeBodyRoll(100000); // clamps to maxRoll
  let roll = 0;
  for (let i = 0; i < 600; i++) {
    roll = dampSpring(roll, target, P.rollResponse, 1 / 60);
    assert.ok(Math.abs(roll) <= P.maxRoll + 1e-9,
      `roll ${roll} must stay within maxRoll at frame ${i}`);
  }
});

test("damped pitch never exceeds maxPitch", () => {
  const target = computeBodyPitch(-100000);
  let pitch = 0;
  for (let i = 0; i < 600; i++) {
    pitch = dampSpring(pitch, target, P.pitchResponse, 1 / 60);
    assert.ok(Math.abs(pitch) <= P.maxPitch + 1e-9,
      `pitch ${pitch} must stay within maxPitch at frame ${i}`);
  }
});
