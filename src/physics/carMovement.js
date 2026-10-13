// =============================================================================
// carMovement — pure driving maths, no WebGL, no React.
// Given current speed + heading + input + dt, returns new speed + heading.
// =============================================================================

// Tunable constants
export const CONFIG = {
  maxForward: 8,      // m/s
  maxReverse: -3.5,   // m/s
  accel: 5,           // m/s²
  brake: 8,           // m/s² (deceleration when reversing direction)
  friction: 5,        // m/s² coast deceleration
  steerRate: 2.4,     // rad/s at standstill (max)
  steerHighSpeedFactor: 0.35, // steering multiplier at max speed (min)
  speedSnap: 0.05,    // below this, snap to 0
};

/**
 * Pure step function.
 * @param {object} state  { speed, heading }
 * @param {object} input  { throttle: -1..1, steer: -1..1 }
 * @param {number} dt     seconds
 * @returns {object}      { speed, heading }
 */
export function stepCar(state, input, dt) {
  const { heading } = state;
  const { throttle, steer } = input;
  const cfg = CONFIG;

  // --- Longitudinal ---
  let newSpeed;
  if (throttle > 0) {
    // Accelerating forward
    if (state.speed >= 0) {
      newSpeed = Math.min(state.speed + cfg.accel * dt * throttle, cfg.maxForward);
    } else {
      // Was reversing — brake first, then accelerate
      newSpeed = Math.min(state.speed + cfg.brake * dt, 0);
      if (newSpeed === 0) newSpeed = Math.min(cfg.accel * dt * throttle, cfg.maxForward);
    }
  } else if (throttle < 0) {
    // Accelerating backward (reverse)
    if (state.speed <= 0) {
      newSpeed = Math.max(state.speed - cfg.accel * Math.abs(throttle) * dt, cfg.maxReverse);
    } else {
      // Was going forward — brake first
      newSpeed = Math.max(state.speed - cfg.brake * dt, 0);
      if (newSpeed === 0) newSpeed = Math.max(-cfg.accel * Math.abs(throttle) * dt, cfg.maxReverse);
    }
  } else {
    // Coast — friction
    if (Math.abs(state.speed) > cfg.speedSnap) {
      const drop = cfg.friction * dt;
      if (state.speed > 0) newSpeed = Math.max(state.speed - drop, 0);
      else newSpeed = Math.min(state.speed + drop, 0);
    } else {
      newSpeed = 0;
    }
  }

  // Snap to zero
  if (Math.abs(newSpeed) < cfg.speedSnap) newSpeed = 0;

  // --- Steering ---
  let newHeading = heading;
  const absSpeed = Math.abs(newSpeed);

  if (absSpeed > 0.05 && steer !== 0) {
    // Yaw rate: strong at low speed, gentle at high speed.
    // speedNorm goes 0 (stopped) → 1 (max speed). Steering = max at 0, min at 1.
    const speedNorm = Math.min(absSpeed / cfg.maxForward, 1);
    const rate = cfg.steerRate * (cfg.steerHighSpeedFactor + (1 - cfg.steerHighSpeedFactor) * (1 - speedNorm));
    // Reverse steering sign when going backward (rear swings opposite)
    const dir = newSpeed > 0 ? 1 : -1;
    newHeading = heading + steer * rate * dir * dt;
  }

  return { speed: newSpeed, heading: newHeading };
}

/**
 * Compute world-space velocity vector from speed + heading.
 * Heading 0 faces +Z. Forward vector = (sin h, 0, cos h).
 */
export function velocityVector(speed, heading) {
  return {
    x: Math.sin(heading) * speed,
    z: Math.cos(heading) * speed,
  };
}

/**
 * Check if a footprint (4 corners) is fully inside an axis-aligned box.
 * @param {Array} corners  [{x, z}, ...]
 * @param {Object} box     { x, z, w, d }  x,z = min corner
 */
export function footprintInsideBox(corners, box) {
  return corners.every(
    (c) => c.x >= box.x && c.x <= box.x + box.w && c.z >= box.z && c.z <= box.z + box.d
  );
}

/**
 * Get car footprint corners given centre position, heading, and dimensions.
 */
export function carCorners(x, z, heading, len, wid) {
  const hx = len / 2;
  const hz = wid / 2;
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  // Forward = (sin h, cos h), Right = (cos h, -sin h)
  // Local corners: lx = along length, lz = along width
  const local = [
    { x: hx, z: hz },
    { x: hx, z: -hz },
    { x: -hx, z: -hz },
    { x: -hx, z: hz },
  ];
  return local.map((p) => ({
    x: x + p.x * sin + p.z * cos,
    z: z + p.x * cos - p.z * sin,
  }));
}
