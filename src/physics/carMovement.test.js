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

test("steer right (D) turns car to the right in forward and reverse", () => {
  // Forward: steer=+1 (D/right) must decrease heading so the car turns toward
  // screen-right. The chase camera looks down +Z with +Y up, so camera-right
  // = cross(+Z, +Y) = -X, and heading decreases toward -X.
  const fwd = stepCar({ speed: 2, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  assert.ok(fwd.heading < 0, "forward + steer right (D) → heading decreases");

  // Reverse: steer=+1 (D/right) must increase heading (rear swings opposite,
  // so the car's rear goes right, nose swings left = heading increases).
  const rev = stepCar({ speed: -2, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  assert.ok(rev.heading > 0, "reverse + steer right (D) → heading increases");
});

test("steer left (A) is the mirror of steer right (D)", () => {
  const fwdRight = stepCar({ speed: 2, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  const fwdLeft = stepCar({ speed: 2, heading: 0 }, { throttle: 0, steer: -1 }, DT);
  assert.ok(
    Math.sign(fwdRight.heading) === -Math.sign(fwdLeft.heading),
    "A and D must produce opposite heading changes"
  );
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

test("car moves in the direction its nose points (regression for heading bug)", () => {
  // Drive forward one frame at heading 0 and confirm the resulting position
  // lies along the car's nose, i.e. the front corners from carCorners.
  const heading = 0;
  const dt = 1 / 60;
  const next = stepCar({ speed: 0, heading }, { throttle: 1, steer: 0 }, dt);

  // Displacement from velocity vector.
  const v = velocityVector(next.speed, next.heading);
  const dispX = v.x * dt;
  const dispZ = v.z * dt;

  // Front corners of a car at the origin with this heading.
  const corners = carCorners(0, 0, heading, 4, 2);
  // corners[0] and corners[1] are the front pair (local +halfLen).
  const frontX = (corners[0].x + corners[1].x) / 2;
  const frontZ = (corners[0].z + corners[1].z) / 2;

  // Displacement must be a positive multiple of the front-midpoint direction.
  assert.ok(dispZ > 0, "at heading 0 the car must move toward +Z");
  assert.ok(Math.abs(dispX) < 0.001, "at heading 0 there is no X displacement");
  // Front midpoint should also be +Z for a correctly-oriented footprint.
  assert.ok(frontZ > 0 && Math.abs(frontX) < 0.001,
    "front of car must point +Z at heading 0");
});

test("steered heading matches the visual turn direction (D = clockwise on screen)", () => {
  // At heading 0 (facing +Z, camera behind looking +Z), screen-right is -X.
  // Steer D (+1) should turn the heading toward -X, i.e. heading decreases.
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 30; i++) {
    state = stepCar(state, { throttle: 0.2, steer: 1 }, DT);
  }
  assert.ok(state.heading < 0, "D must steer toward screen-right (-X)");

  // After turning, the velocity vector should point into the -X half-plane.
  const v = velocityVector(state.speed, state.heading);
  assert.ok(v.x < 0, "velocity X must be negative after steering right");
});

test("car corners rotate with heading", () => {
  const c0 = carCorners(0, 0, 0, 4, 2);
  // At heading 0, front-right corner should be at x>0, z>0
  assert.ok(c0[0].x > 0 && c0[0].z > 0, "corner 0 front-right at heading 0");

  // At 90°, front should point +X. Corner 0 (front-right) → (2, -1)
  const c90 = carCorners(0, 0, Math.PI / 2, 4, 2);
  assert.ok(c90[0].x > 0 && c90[0].z < 0, "corner 0 forward +X at 90°");
});
