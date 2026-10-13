// Completability proof — drives each track using the pure movement module
// with a waypoint-following controller. Run with:
//   node --test src/physics/completability.test.js
import { test } from "node:test";
import assert from "node:assert";
import { stepCar, carCorners, footprintInsideBox } from "./carMovement.js";
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

function driveToward(state, x, z, tx, tz) {
  const dx = tx - x;
  const dz = tz - z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) return { throttle: 0, steer: 0 };

  const targetAngle = Math.atan2(dx, dz);
  const fwdErr = angleDiff(targetAngle, state.heading);
  const revErr = angleDiff(targetAngle + Math.PI, state.heading);

  const MIN_FWD = 0.65;
  const MIN_REV = -0.65;

  let throttle, steer;
  if (Math.abs(fwdErr) <= Math.abs(revErr)) {
    steer = Math.max(-1, Math.min(1, fwdErr * 1.5));
    throttle = dist > 2.0 ? 0.7 : MIN_FWD;
  } else {
    steer = Math.max(-1, Math.min(1, -revErr * 1.5));
    throttle = dist > 2.0 ? -0.7 : MIN_REV;
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
  let state = { speed: 0, heading: track.start.heading };
  let x = track.start.x;
  let z = track.start.z;
  let wpIdx = 0;
  let hits = 0;
  let completed = false;
  let stopTimer = 0;
  const maxFrames = 4000;

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
      // Brake: apply opposite throttle to slow down
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

    // Cone collision
    for (const cone of track.cones) {
      if (carHitsCone(corners, cone)) { hits++; }
    }

    // Corridor check
    if (corridorCheck && !corridorCheck(x, z)) {
      hits++;
    }

    // Completion: footprint inside box + stopped for 0.5s (mirrors game)
    const inside = footprintInsideBox(corners, track.finish);
    const slowEnough = Math.abs(state.speed) < 0.3;
    if (inside && slowEnough) {
      stopTimer += DT;
      if (stopTimer >= 0.5) {
        completed = hits === 0;
        break;
      }
    } else {
      stopTimer = 0;
    }

    // No early exit — let the freeze condition trigger naturally
  }

  return { hits, completed, finalPos: { x, z } };
}

test("L-Track is completable with a careful reverse manoeuvre", () => {
  const track = getTrack("ltrack");

  // Finish box center: x=5.5+2.5=8.0, z=-6.5+1.5=-5.0
  const coarse = [
    { x: 0, z: 12 },    // start
    { x: 0, z: 1 },     // reverse down long leg
    { x: 0, z: -3 },    // approach corner
    { x: 1.5, z: -5.5 },// into corner
    { x: 5, z: -5.0 },  // into short leg
    { x: 8.0, z: -5.0 },// finish box centre
  ];
  const path = buildPath(coarse, 0.5);
  // Corridor: long leg + short leg with overlap at corner
  const corridorCheck = (x, z) =>
    (x > -3.5 && x < 3.5 && z > -6 && z < 13) ||   // long leg
    (x > 2.5 && x < 11 && z > -9 && z < -2) ||      // short leg
    (x >= 2.5 && x <= 3.5 && z > -6 && z < -2);     // corner overlap

  const result = simulate(track, path, corridorCheck);
  console.log(`  L-Track: final (${result.finalPos.x.toFixed(2)}, ${result.finalPos.z.toFixed(2)}), hits=${result.hits}, completed=${result.completed}`);
  console.log(`  Finish box: x[${track.finish.x}, ${track.finish.x + track.finish.w}], z[${track.finish.z}, ${track.finish.z + track.finish.d}]`);

  assert.ok(result.completed, `L-Track should be completable with 0 hits, got ${result.hits} hits`);
});

test("Parking track is completable", () => {
  const track = getTrack("parking");

  // Finish box center: x=-15+2.5=-12.5, z=-1+1.5=0.5
  const coarse = [
    { x: 2, z: 12 },    // start
    { x: 2, z: 5 },     // reverse along road
    { x: -3, z: 4 },    // turn toward bay entrance
    { x: -10.5, z: 0 }, // into bay
    { x: -12.5, z: 0.5 },// finish box centre
  ];
  const path = buildPath(coarse, 0.5);
  // Corridor: road + bay with overlap
  const corridorCheck = (x, z) =>
    (x > -2 && x < 6 && z > -4 && z < 13) ||       // road
    (x > -14 && x < -7 && z > -5 && z < 5) ||       // bay
    (x >= -7 && x <= -2 && z > -4 && z < 5);        // transition overlap

  const result = simulate(track, path, corridorCheck);
  console.log(`  Parking: final (${result.finalPos.x.toFixed(2)}, ${result.finalPos.z.toFixed(2)}), hits=${result.hits}, completed=${result.completed}`);
  console.log(`  Finish box: x[${track.finish.x}, ${track.finish.x + track.finish.w}], z[${track.finish.z}, ${track.finish.z + track.finish.d}]`);

  assert.ok(result.completed, `Parking should be completable with 0 hits, got ${result.hits} hits`);
});
