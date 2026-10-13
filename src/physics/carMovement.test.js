// Unit tests for pure car movement maths — run with: node --test
import { test } from "node:test";
import assert from "node:assert";
import {
  stepCar,
  velocityVector,
  footprintInsideBox,
  carCorners,
  CONFIG,
} from "./carMovement.js";

const DT = 1 / 60; // 60fps frame

test("forward accelerates along facing direction", () => {
  let state = { speed: 0, heading: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 1, steer: 0 }, DT);
  }
  assert.ok(state.speed > 0, "speed should be positive");
  assert.ok(state.speed <= CONFIG.maxForward, "speed capped at maxForward");
  assert.strictEqual(state.heading, 0, "heading unchanged with no steer");
});

test("reverse accelerates backward with lower top speed", () => {
  let state = { speed: 0, heading: 0 };
  for (let i = 0; i < 120; i++) {
    state = stepCar(state, { throttle: -1, steer: 0 }, DT);
  }
  assert.ok(state.speed < 0, "speed should be negative");
  assert.ok(state.speed >= CONFIG.maxReverse, "reverse capped at maxReverse");
  assert.ok(Math.abs(state.speed) < CONFIG.maxForward, "reverse slower than forward");
});

test("velocity vector aligns with heading", () => {
  // Heading 0 → +Z
  const v0 = velocityVector(5, 0);
  assert.ok(Math.abs(v0.x) < 0.001, "x ~ 0 at heading 0");
  assert.ok(v0.z > 0, "z positive at heading 0");

  // Heading 90° → +X
  const v90 = velocityVector(5, Math.PI / 2);
  assert.ok(v90.x > 0, "x positive at heading 90°");
  assert.ok(Math.abs(v90.z) < 0.001, "z ~ 0 at heading 90°");
});

test("steering has zero effect when stationary", () => {
  const state = { speed: 0, heading: 0 };
  const next = stepCar(state, { throttle: 0, steer: 1 }, DT);
  assert.strictEqual(next.heading, 0, "heading unchanged at zero speed");
});

test("steering is stronger at low speed than high speed", () => {
  // Low speed steering
  let low = { speed: 1, heading: 0 };
  for (let i = 0; i < 10; i++) low = stepCar(low, { throttle: 0.1, steer: 1 }, DT);
  const lowDelta = Math.abs(low.heading);

  // High speed steering
  let high = { speed: 7, heading: 0 };
  for (let i = 0; i < 10; i++) high = stepCar(high, { throttle: 0.1, steer: 1 }, DT);
  const highDelta = Math.abs(high.heading);

  assert.ok(lowDelta > highDelta, "low speed should turn more than high speed");
});

test("reversing steering swings rear correctly", () => {
  // Forward steer left → heading increases
  const fwd = stepCar({ speed: 2, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  assert.ok(fwd.heading > 0, "forward + steer left → heading increases");

  // Reverse steer left → heading decreases (rear swings opposite)
  const rev = stepCar({ speed: -2, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  assert.ok(rev.heading < 0, "reverse + steer left → heading decreases");
});

test("friction brings car to exactly zero", () => {
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 200; i++) {
    state = stepCar(state, { throttle: 0, steer: 0 }, DT);
  }
  assert.strictEqual(state.speed, 0, "speed snaps to exactly 0");
});

test("opposite pedals cancel out", () => {
  let state = { speed: 0, heading: 0 };
  // Press both forward and reverse
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 1, steer: 0 }, DT);
  }
  const forwardSpeed = state.speed;

  // Now press reverse while moving forward — should decelerate
  for (let i = 0; i < 30; i++) {
    state = stepCar(state, { throttle: -1, steer: 0 }, DT);
  }
  assert.ok(state.speed < forwardSpeed, "reverse should slow forward motion");
});

test("footprint inside box detection", () => {
  const box = { x: 0, z: 0, w: 4, d: 4 };
  // Corners fully inside
  const inside = [{ x: 1, z: 1 }, { x: 2, z: 1 }, { x: 2, z: 2 }, { x: 1, z: 2 }];
  assert.ok(footprintInsideBox(inside, box), "should be inside");

  // One corner outside
  const outside = [{ x: 1, z: 1 }, { x: 5, z: 1 }, { x: 2, z: 2 }, { x: 1, z: 2 }];
  assert.ok(!footprintInsideBox(outside, box), "should be outside");
});

test("car corners rotate with heading", () => {
  const c0 = carCorners(0, 0, 0, 4, 2);
  // At heading 0, front-right corner should be at x>0, z>0
  assert.ok(c0[0].x > 0 && c0[0].z > 0, "corner 0 front-right at heading 0");

  // At 90°, front should point +X. Corner 0 (front-right) → (2, -1)
  const c90 = carCorners(0, 0, Math.PI / 2, 4, 2);
  assert.ok(c90[0].x > 0 && c90[0].z < 0, "corner 0 forward +X at 90°");
});
