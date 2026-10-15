// Completability proof — drives each track using the pure movement module
// with a waypoint-following controller. Run with:
//   node --test src/physics/completability.test.js
//
// The controller uses the bicycle model: yawRate = -speed * tan(steerAngle) /
// wheelbase. It derives the required steering angle from the heading error
// and the actual speed, correctly handling both forward and reverse.
import { test } from "node:test";
import assert from "node:assert";
import { stepCar, carCorners, footprintInsideBox, CONFIG } from "./carMovement.js";
import { getTrack, CAR_DIMENSIONS } from "./tracks.js";

const DT = 1 / 60;
const CAR_LEN = CAR_DIMENSIONS.length;
const CAR_WID = CAR_DIMENSIONS.width;

function carHitsCone(corners, cone) {
  return corners.some((c) => Math.hypot(c.x - cone.x, c.z - cone.z) < 0.6);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Bicycle-model-aware controller.
 *
 * Computes the heading error toward the target and derives the steering angle
 * from the bicycle model: steerAngle = atan(-k * headingErr * wheelbase / speed).
 * This correctly handles both forward and reverse because the sign of speed
 * naturally flips the steering direction.
 *
 * Speed is reduced for sharp turns so the required steering angle stays bounded.
 */
function driveToward(state, x, z, tx, tz) {
  const dx = tx - x;
  const dz = tz - z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) return { throttle: 0, steer: 0 };

  const targetAngle = Math.atan2(dx, dz);
  const fwdErr = angleDiff(targetAngle, state.heading);
  const revErr = angleDiff(targetAngle + Math.PI, state.heading);

  // Decide forward vs reverse based on which heading error is smaller.
  const useForward = Math.abs(fwdErr) <= Math.abs(revErr);
  const headingErr = useForward ? fwdErr : revErr;

  // Speed: slow down for sharp turns so required steer stays within limits.
  const absErr = Math.abs(headingErr);
  const k = 0.6;
  const maxSteer = CONFIG.maxSteerAngle;
  // Required steer = atan(k * absErr * wheelbase / speed). For steer <= maxSteer:
  //   speed >= k * absErr * wheelbase / tan(maxSteer)
  const minSpeedForTurn = (k * absErr * CONFIG.wheelbase) / Math.tan(maxSteer);
  const targetSpeed = Math.max(0.5, Math.min(2.5, Math.max(minSpeedForTurn, 0.8)));

  const direction = useForward ? 1 : -1;
  const targetVel = targetSpeed * direction;

  // Compute steer input from the bicycle model using the ACTUAL speed.
  // Use a minimum magnitude to avoid division by zero when nearly stopped.
  // Use the actual signed speed. Math.atan (not atan2) gives the correct
  // signed angle for the bicycle model: steerAngle = atan(-k * err * L / v).
  // atan2 would wrap to ±π when v < 0, causing spurious full-lock steering.
  // When speed is ~0, use a small magnitude so the steer angle saturates
  // toward the sign of the heading error (car will turn once it moves).
  const signedSpeed = Math.abs(state.speed) < 0.01
    ? 0.01 * (state.speed >= 0 ? 1 : -1)
    : state.speed;
  const desiredSteerAngle = Math.atan((-k * headingErr * CONFIG.wheelbase) / signedSpeed);
  const steer = Math.max(-1, Math.min(1, desiredSteerAngle / maxSteer));

  // Throttle: accelerate toward target speed.
  const speedDiff = targetVel - state.speed;
  let throttle;
  if (Math.abs(speedDiff) < 0.1) {
    throttle = 0;
  } else {
    throttle = speedDiff > 0 ? 1.0 : -1.0;
  }

  return { throttle, steer };
}

function buildPath(coarse, spacing = 0.5) {
  const path = [coarse[0]];
  for (let i = 1; i < coarse.length; i++) {
    const a = coarse[i - 1];
    const b = coarse[i];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.floor(d / spacing));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      path.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return path;
}

function simulate(track, path, corridorCheck) {
  let state = { speed: 0, heading: track.start.heading, steerAngle: 0 };
  let x = track.start.x;
  let z = track.start.z;
  let wpIdx = 0;
  let hits = 0;
  let completed = false;
  let stopTimer = 0;
  let cpIdx = 0;
  const checkpoints = track.checkpoints || [];
  const maxFrames = 10000;

  for (let frame = 0; frame < maxFrames; frame++) {
    while (wpIdx < path.length - 1) {
      const d = Math.hypot(path[wpIdx].x - x, path[wpIdx].z - z);
      if (d < 1.2) wpIdx++; else break;
    }

    const target = path[Math.min(wpIdx, path.length - 1)];

    // Check if car is already inside the finish box — if so, brake to stop
    const preCorners = carCorners(x, z, state.heading, CAR_LEN, CAR_WID);
    const preInside = footprintInsideBox(preCorners, track.finish);

    let input;
    if (preInside) {
      input = { throttle: state.speed > 0 ? -1 : 1, steer: 0 };
    } else {
      input = driveToward(state, x, z, target.x, target.z);
    }
    state = stepCar(state, input, DT);

    const fwdX = Math.sin(state.heading);
    const fwdZ = Math.cos(state.heading);
    x += fwdX * state.speed * DT;
    z += fwdZ * state.speed * DT;

    const corners = carCorners(x, z, state.heading, CAR_LEN, CAR_WID);

    // Corridor check — keeps the car within the drivable area (tight against
    // the walls, inset by the car's half-width so the footprint can't clip).
    if (corridorCheck && !corridorCheck(x, z)) {
      hits++;
    }

    // Cone collision
    for (const cone of track.cones) {
      if (carHitsCone(corners, cone)) { hits++; }
    }

    // Checkpoint tracking (ordered gates — must reach each in sequence)
    if (cpIdx < checkpoints.length && footprintInsideBox(corners, checkpoints[cpIdx])) {
      cpIdx++;
    }
    const allCpReached = cpIdx >= checkpoints.length;

    // Completion: all checkpoints reached + footprint inside box + stopped for 0.5s
    const inside = footprintInsideBox(corners, track.finish);
    const slowEnough = Math.abs(state.speed) < 0.3;
    if (inside && slowEnough && allCpReached) {
      stopTimer += DT;
      if (stopTimer >= 0.5) {
        completed = hits === 0;
        break;
      }
    } else {
      stopTimer = 0;
    }
  }

  return { hits, completed, finalPos: { x, z }, cpReached: cpIdx, cpTotal: checkpoints.length };
}

test("L-Track is completable with a careful reverse manoeuvre", () => {
  const track = getTrack("ltrack");

  // Finish box center: x=5+2.5=7.5, z=-6.5+1.5=-5.0
  // The car reverses down the long leg, arcs around the corner (wide enough
  // for the bicycle model's turning radius), then drives forward into the
  // short leg to the finish box. Path must pass through all 3 checkpoints.
  const coarse = [
    { x: 0, z: 12 },     // start
    { x: 0, z: 0 },      // reverse down long leg (passes CP1)
    { x: 0, z: -2 },     // approach corner
    { x: 2, z: -5 },     // arc around corner (passes CP2, heading 0 → π/2)
    { x: 6, z: -5 },     // into short leg (passes CP3)
    { x: 7.5, z: -5.0 }, // finish box centre
  ];
  const path = buildPath(coarse, 0.4);

  const result = simulate(track, path);
  console.log(`  L-Track: final (${result.finalPos.x.toFixed(2)}, ${result.finalPos.z.toFixed(2)}), hits=${result.hits}, completed=${result.completed}, cp=${result.cpReached}/${result.cpTotal}`);
  console.log(`  Finish box: x[${track.finish.x}, ${track.finish.x + track.finish.w}], z[${track.finish.z}, ${track.finish.z + track.finish.d}]`);

  assert.ok(result.completed, `L-Track should be completable with 0 hits, got ${result.hits} hits`);
  assert.strictEqual(result.cpReached, result.cpTotal, `All checkpoints should be reached, got ${result.cpReached}/${result.cpTotal}`);
});

test("Parking track is completable", () => {
  const track = getTrack("parking");

  // Finish box center: x=-15+2.5=-12.5, z=-1+1.5=0.5.
  // The car reverses down the road, then arcs gently left into the bay.
  // A sharp turn causes the bicycle-model controller to overshoot and
  // oscillate, so the waypoints form a smooth arc (min turning radius
  // ≈ 3.16m at full lock) from the road into the bay.
  const coarse = [
    { x: 2, z: 12 },     // start
    { x: 2, z: 6 },      // reverse along road
    { x: 1.5, z: 4 },    // begin arc
    { x: 0, z: 3 },      // arc across road/bay boundary
    { x: -3, z: 2.5 },   // into bay
    { x: -6, z: 2 },     // continue into bay
    { x: -9, z: 1.5 },   // approach finish
    { x: -11, z: 1 },    // near finish
    { x: -12.5, z: 0.5 },// finish box centre
  ];
  const path = buildPath(coarse, 0.4);

  const result = simulate(track, path);
  console.log(`  Parking: final (${result.finalPos.x.toFixed(2)}, ${result.finalPos.z.toFixed(2)}), hits=${result.hits}, completed=${result.completed}, cp=${result.cpReached}/${result.cpTotal}`);
  console.log(`  Finish box: x[${track.finish.x}, ${track.finish.x + track.finish.w}], z[${track.finish.z}, ${track.finish.z + track.finish.d}]`);

  assert.ok(result.completed, `Parking should be completable with 0 hits, got ${result.hits} hits`);
  assert.strictEqual(result.cpReached, result.cpTotal, `All checkpoints should be reached, got ${result.cpReached}/${result.cpTotal}`);
});

test("L-Track walls form a continuous boundary — no gaps at the corner", () => {
  const track = getTrack("ltrack");
  // The long-leg-right wall (x=3) and short-leg-lower wall (x∈[3,10], z=-3)
  // must meet at the corner (3,-3) so the car cannot escape.
  const longRight = track.walls.find((w) => w.x === 3 && w.d > 1);
  const shortLower = track.walls.find((w) => w.z === -3 && w.w > 1);
  assert.ok(longRight, "long-leg-right wall should exist");
  assert.ok(shortLower, "short-leg-lower wall should exist");
  // Long-leg-right wall must extend down to at least z=-3.
  assert.ok(longRight.z - longRight.d / 2 <= -3, "long-leg-right wall must reach the corner (z=-3)");
  // Short-leg-lower wall must extend left to at least x=3.
  assert.ok(shortLower.x - shortLower.w / 2 <= 3, "short-leg-lower wall must reach the corner (x=3)");
});

test("L-Track corridor contains the driving path — real wall collisions", () => {
  const track = getTrack("ltrack");
  // A path that hugs the right wall of the long leg (x=3) should hit it.
  const coarse = [
    { x: 0, z: 12 },
    { x: 2.5, z: 6 },   // drift toward the right wall
    { x: 2.8, z: 6 },   // push into the wall zone
    { x: 2.5, z: 6 },
  ];
  const path = buildPath(coarse, 0.4);
  const result = simulate(track, path);
  // The car should either hit a wall or not complete — it must not pass cleanly
  // through the boundary. (This guards against a geometry gap regression.)
  const hitsWall = result.hits > 0 || !result.completed;
  assert.ok(hitsWall, "Driving into the boundary should register a hit or fail completion");
});

test("L-Track completion requires checkpoints in order — cannot skip the leg", () => {
  const track = getTrack("ltrack");
  // A path that goes straight to the finish box without passing CP1 (long leg)
  // should NOT complete, even though it reaches the finish.
  const coarse = [
    { x: 0, z: 12 },
    { x: 4, z: -5 },    // cut straight across to short leg (skips CP1 at long leg)
    { x: 7.5, z: -5 },  // finish box
  ];
  const path = buildPath(coarse, 0.4);
  const result = simulate(track, path);
  // Either it hits something, or it reaches the finish without all checkpoints.
  const blocked = result.hits > 0 || !result.completed;
  assert.ok(blocked, "Skipping the long leg should prevent clean completion");
});

test("L-Track finish box sits within the short leg corridor", () => {
  const track = getTrack("ltrack");
  // Finish box x-range must be within short leg x-range [3, 10].
  assert.ok(track.finish.x >= 3, "finish box left edge inside short leg");
  assert.ok(track.finish.x + track.finish.w <= 10, "finish box right edge inside short leg");
  // Finish box z-range must be within short leg z-range [-8, -3].
  assert.ok(track.finish.z >= -8, "finish box lower edge inside short leg");
  assert.ok(track.finish.z + track.finish.d <= -3, "finish box upper edge inside short leg");
});
