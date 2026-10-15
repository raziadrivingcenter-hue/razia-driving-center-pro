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

test("steering produces a tighter turn radius at low speed than high speed", () => {
  // With the bicycle model, curvature = tan(steerAngle) / wheelbase. The
  // speed-dependent steering reduction means the effective steering angle is
  // SMALLER at high speed, so the turn radius is LARGER (wider turn).
  // Heading delta per frame actually *increases* with speed (yawRate ∝ speed),
  // so we compare turn radius, not heading delta.
  //
  // Build up steering angle at low speed (full authority) and high speed
  // (reduced authority), then compare the resulting turn radius.
  let low = { speed: 1, heading: 0 };
  for (let i = 0; i < 60; i++) low = stepCar(low, { throttle: 0.1, steer: 1 }, DT);
  const lowRadius = Math.abs(low.speed / (-low.speed * Math.tan(low.steerAngle) / CONFIG.wheelbase + 1e-10));

  let high = { speed: 7, heading: 0 };
  for (let i = 0; i < 60; i++) high = stepCar(high, { throttle: 0.1, steer: 1 }, DT);
  const highRadius = Math.abs(high.speed / (-high.speed * Math.tan(high.steerAngle) / CONFIG.wheelbase + 1e-10));

  // Turn radius R = wheelbase / tan(steerAngle). At low speed, steerAngle is
  // larger → R is smaller → tighter turn.
  assert.ok(lowRadius < highRadius,
    `low-speed turn radius (${lowRadius.toFixed(2)}m) should be tighter than high-speed (${highRadius.toFixed(2)}m)`);
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

// --- New bicycle-model acceptance tests ---

test("holding steering at zero speed does not spin the car", () => {
  // The core fix: at v=0, yaw rate must be zero regardless of steer input.
  let state = { speed: 0, heading: 0 };
  for (let i = 0; i < 30; i++) {
    state = stepCar(state, { throttle: 0, steer: 1 }, DT);
  }
  assert.strictEqual(state.heading, 0, "car must not rotate at zero speed");
  assert.strictEqual(state.speed, 0, "car must remain stationary");
});

test("forward motion with right steering produces a curved right turn", () => {
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 0.3, steer: 1 }, DT);
  }
  assert.ok(state.heading < 0, "heading must decrease (turn right)");
  // After 1 second at ~3 m/s, heading should have changed meaningfully.
  assert.ok(Math.abs(state.heading) > 0.05, "heading change should be visible");
});

test("forward motion with left steering produces a curved left turn", () => {
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 0.3, steer: -1 }, DT);
  }
  assert.ok(state.heading > 0, "heading must increase (turn left)");
});

test("reverse steering produces the correct reversing arc", () => {
  // Reversing with steer right (D, +1): rear swings right, nose swings left.
  // Nose swinging left = heading increases.
  let state = { speed: -2, heading: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: -0.3, steer: 1 }, DT);
  }
  assert.ok(state.heading > 0, "reverse + D must increase heading");
});

test("heading changes gradually with distance travelled (not instant)", () => {
  // After a short burst of steering, heading should be small (not a big jump).
  const state = stepCar({ speed: 3, heading: 0 }, { throttle: 0, steer: 1 }, DT);
  // One frame at 60fps: heading change should be small.
  assert.ok(Math.abs(state.heading) < 0.05, "heading change per frame must be gradual");
});

test("straight driving does not introduce unintended yaw", () => {
  let state = { speed: 4, heading: 0.5 };
  for (let i = 0; i < 120; i++) {
    state = stepCar(state, { throttle: 0.5, steer: 0 }, DT);
  }
  assert.strictEqual(state.heading, 0.5, "heading must stay constant with no steering");
});

test("steering angle state is exposed and bounded", () => {
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 0.3, steer: 1 }, DT);
  }
  assert.ok(typeof state.steerAngle === "number", "steerAngle must be in state");
  assert.ok(Math.abs(state.steerAngle) <= CONFIG.maxSteerAngle + 0.01,
    "steerAngle must not exceed maxSteerAngle");
});

test("steering returns toward center when input released", () => {
  // Build up steering angle.
  let state = { speed: 3, heading: 0 };
  for (let i = 0; i < 30; i++) {
    state = stepCar(state, { throttle: 0.3, steer: 1 }, DT);
  }
  const steered = state.steerAngle;
  assert.ok(Math.abs(steered) > 0.1, "steerAngle should be significant");

  // Release steering — angle should decay toward zero.
  for (let i = 0; i < 60; i++) {
    state = stepCar(state, { throttle: 0.3, steer: 0 }, DT);
  }
  assert.ok(Math.abs(state.steerAngle) < Math.abs(steered),
    "steerAngle should return toward center");
});

test("front wheels visually agree with vehicle path (sign check)", () => {
  // Forward + steer right: heading decreases, steerAngle > 0.
  const fwd = stepCar({ speed: 3, heading: 0 }, { throttle: 0, steer: 1 }, 0.1);
  assert.ok(fwd.steerAngle > 0, "steerAngle positive for D (right)");
  assert.ok(fwd.heading < 0, "heading decreases for right turn");

  // Forward + steer left: heading increases, steerAngle < 0.
  const fwdLeft = stepCar({ speed: 3, heading: 0 }, { throttle: 0, steer: -1 }, 0.1);
  assert.ok(fwdLeft.steerAngle < 0, "steerAngle negative for A (left)");
  assert.ok(fwdLeft.heading > 0, "heading increases for left turn");
});

test("stationary car does not drift after releasing controls (regression for post-stop yaw)", () => {
  // Drive forward, build up some steering, then release all input and coast
  // to a stop. Once stopped, the heading must remain stable — no residual
  // steerAngle or yaw should accumulate.
  let state = { speed: 0, heading: 0.3, steerAngle: 0 };

  // Accelerate and steer for a while.
  for (let i = 0; i < 90; i++) {
    state = stepCar(state, { throttle: 0.5, steer: 0.7 }, DT);
  }

  // Release all input — coast to stop.
  let guard = 0;
  while (Math.abs(state.speed) > 0 && guard < 600) {
    state = stepCar(state, { throttle: 0, steer: 0 }, DT);
    guard++;
  }
  assert.strictEqual(state.speed, 0, "car should come to a stop");
  const stoppedHeading = state.heading;

  // Now sit with no input for 600 frames (10 seconds) and confirm the heading
  // does not change at all.
  for (let i = 0; i < 600; i++) {
    state = stepCar(state, { throttle: 0, steer: 0 }, DT);
  }
  assert.strictEqual(state.speed, 0, "car must remain stopped");
  assert.strictEqual(state.steerAngle, 0, "steerAngle must be zero when stopped with no input");
  assert.strictEqual(state.heading, stoppedHeading,
    "heading must be stable after stopping — no post-stop yaw drift");
});
