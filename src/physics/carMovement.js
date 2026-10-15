// =============================================================================
// carMovement — pure driving maths, no WebGL, no React.
//
// Front-wheel-steered vehicle dynamics using the bicycle model:
//   yawRate = speed * tan(steerAngle) / wheelbase
//
// The front wheels determine the curvature of the path; the rear axle
// follows naturally. At zero speed the car does not rotate simply because
// the steering key is held. Steering authority is reduced at speed for
// stability. Steering angle transitions are smoothed with a first-order
// approach/return model.
//
// State: { speed, heading, steerAngle }
//   speed      — signed longitudinal velocity (m/s, + forward / - reverse)
//   heading    — yaw radians; 0 faces +Z, π/2 faces +X
//   steerAngle — smoothed front-wheel steering angle (radians)
//
// Input: { throttle: -1..1, steer: -1..1 }
//   steer +1 = D = turn toward screen-right (-X)
// =============================================================================

// Tunable constants
export const CONFIG = {
  maxForward: 8,        // m/s
  maxReverse: -3.5,     // m/s
  accel: 5,             // m/s²
  brake: 8,             // m/s² (deceleration when reversing direction)
  friction: 5,          // m/s² coast deceleration
  speedSnap: 0.05,      // below this, snap to 0

  // --- Bicycle model ---
  wheelbase: 2.4,       // distance between front and rear axles (m)
  maxSteerAngle: 0.65,  // maximum front-wheel steering angle (rad) ~37°
  steerResponse: 6.0,   // steering angle approach rate when input held (1/s)
  steerReturn: 5.0,     // steering return-to-center rate when released (1/s)

  // Speed-dependent steering reduction for stability.
  // Gentle falloff so the car stays manoeuvrable at driving-test speeds
  // (reverse parking is done at low speed and needs full steering authority).
  steerSpeedFalloff: 10.0, // m/s
  steerMinFactor: 0.55,    // minimum steering factor at high speed
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Pure step function.
 * @param {object} state  { speed, heading, steerAngle? }
 * @param {object} input  { throttle: -1..1, steer: -1..1 }
 * @param {number} dt     seconds
 * @returns {object}      { speed, heading, steerAngle }
 */
export function stepCar(state, input, dt) {
  let { speed, heading, steerAngle = 0 } = state;
  const { throttle, steer } = input;
  const cfg = CONFIG;

  // --- Longitudinal ---
  let newSpeed;
  if (throttle > 0) {
    // Accelerating forward
    if (speed >= 0) {
      newSpeed = Math.min(speed + cfg.accel * dt * throttle, cfg.maxForward);
    } else {
      // Was reversing — brake first, then accelerate
      newSpeed = Math.min(speed + cfg.brake * dt, 0);
      if (newSpeed === 0) newSpeed = Math.min(cfg.accel * dt * throttle, cfg.maxForward);
    }
  } else if (throttle < 0) {
    // Accelerating backward (reverse)
    if (speed <= 0) {
      newSpeed = Math.max(speed - cfg.accel * Math.abs(throttle) * dt, cfg.maxReverse);
    } else {
      // Was going forward — brake first
      newSpeed = Math.max(speed - cfg.brake * dt, 0);
      if (newSpeed === 0) newSpeed = Math.max(-cfg.accel * Math.abs(throttle) * dt, cfg.maxReverse);
    }
  } else {
    // Coast — friction
    if (Math.abs(speed) > cfg.speedSnap) {
      const drop = cfg.friction * dt;
      if (speed > 0) newSpeed = Math.max(speed - drop, 0);
      else newSpeed = Math.min(speed + drop, 0);
    } else {
      newSpeed = 0;
    }
  }

  // Snap to zero
  if (Math.abs(newSpeed) < cfg.speedSnap) newSpeed = 0;

  // --- Steering angle dynamics ---
  // Target steering from input, reduced at speed for stability.
  const absSpeed = Math.abs(newSpeed);
  const speedFactor = clamp(1 - absSpeed / cfg.steerSpeedFalloff, cfg.steerMinFactor, 1);
  const targetSteer = steer * cfg.maxSteerAngle * speedFactor;
  // Smooth approach toward target; faster return to center when released.
  const rate = steer !== 0 ? cfg.steerResponse : cfg.steerReturn;
  steerAngle += (targetSteer - steerAngle) * Math.min(rate * dt, 1);
  if (Math.abs(steerAngle) < 0.001) steerAngle = 0;
  // When fully stopped with no input, force steerAngle to zero immediately so
  // the car retains no steering authority the instant it starts moving again.
  if (newSpeed === 0 && steer === 0) steerAngle = 0;

  // --- Bicycle model yaw rate ---
  // yawRate = -speed * tan(steerAngle) / wheelbase
  // Negative sign: steerAngle>0 (D / right) must DECREASE heading so the car
  // turns toward screen-right (-X). The chase camera looks down +Z with +Y up,
  // so camera-right = cross(+Z,+Y) = -X, and heading decreases toward -X.
  const yawRate = -(newSpeed * Math.tan(steerAngle)) / cfg.wheelbase;
  const newHeading = heading + yawRate * dt;

  return { speed: newSpeed, heading: newHeading, steerAngle };
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
