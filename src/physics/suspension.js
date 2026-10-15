// =============================================================================
// suspension — pure visual-suspension math for the driving game.
//
// NOT real physics. Produces target body roll, body pitch, and per-wheel
// vertical offsets from longitudinal/lateral acceleration. GltfCar damps these
// targets toward current values each frame so the Wagon R feels heavier.
//
// Conventions (car-local axes, matching GltfCar / carMovement):
//   +Z = front,  +X = left,  -X = right,  +Y = up
//   roll  +  → lean right  (left side up, right side down)
//   pitch +  → nose down   (front dips, rear rises)
//   yawRate = -(speed * tan(steerAngle)) / wheelbase   (bicycle model)
//   lateralAccel = speed * yawRate   (negative for a right turn)
//   longAccel = dSpeed / dt          (positive accelerating forward)
// =============================================================================

// Tunable parameters. Gains are small because this is a low-speed driving-test
// simulator — effects must be subtle, never exaggerated.
export const SUSPENSION_PARAMS = {
  // --- Body roll (radians) ---
  rollGain: 0.018,     // roll per unit lateral acceleration
  rollResponse: 5,     // approach rate toward target (1/s)
  maxRoll: 0.06,       // ~3.4° maximum roll

  // --- Body pitch (radians) ---
  pitchGain: 0.025,    // pitch per unit longitudinal acceleration (see sign note)
  pitchResponse: 4,    // approach rate toward target (1/s)
  maxPitch: 0.035,     // ~2.0° maximum pitch

  // --- Per-wheel suspension travel (metres) ---
  susLongGain: 0.012,  // vertical travel per unit longitudinal acceleration
  susLatGain: 0.01,    // vertical travel per unit lateral acceleration
  susResponse: 8,      // approach rate toward target (1/s)
  maxTravel: 0.05,     // 5 cm maximum wheel travel from rest
};

export function clamp(v, lo, hi) {
  const r = Math.max(lo, Math.min(hi, v));
  // Normalise -0 to 0 so strict-equal comparisons and downstream sums are clean.
  return r === 0 ? 0 : r;
}

/**
 * Exponential approach toward a target. Stable and framerate-independent —
 * never overshoots, converges to target as dt→∞.
 * @returns new current value
 */
export function dampSpring(current, target, rate, dt) {
  if (!(dt > 0)) return current;
  const alpha = 1 - Math.exp(-rate * dt);
  return current + (target - current) * alpha;
}

/**
 * Target body roll (radians) from lateral acceleration.
 * Right turn → lateralAccel < 0 → roll < 0 → leans left (outside of turn).
 */
export function computeBodyRoll(lateralAccel, p = SUSPENSION_PARAMS) {
  return clamp(lateralAccel * p.rollGain, -p.maxRoll, p.maxRoll);
}

/**
 * Target body pitch (radians) from longitudinal acceleration.
 *
 * Sign: acceleration (longAccel > 0) shifts weight rearward, so the nose rises.
 * Positive rotation.x pitches the nose DOWN in Three.js, so we negate: accel
 * yields a negative pitch (nose up). Braking (longAccel < 0) yields nose down.
 */
export function computeBodyPitch(longAccel, p = SUSPENSION_PARAMS) {
  return clamp(-longAccel * p.pitchGain, -p.maxPitch, p.maxPitch);
}

/**
 * Per-wheel vertical offsets in metres (+ = up toward the body = compression).
 *
 * Longitudinal load transfer: accel → rear compresses (+), front extends (-).
 *   front = -longAccel * gain,   rear = +longAccel * gain
 * Lateral load transfer: right turn (lateralAccel<0) → left compresses (+).
 *   left  = -lateralAccel * gain, right = +lateralAccel * gain
 *
 * @returns {{ FL, FR, RL, RR }} offsets in metres from each wheel's rest position
 */
export function suspensionOffsets(longAccel, lateralAccel, p = SUSPENSION_PARAMS) {
  const front = clamp(-longAccel * p.susLongGain, -p.maxTravel, p.maxTravel);
  const rear = clamp(longAccel * p.susLongGain, -p.maxTravel, p.maxTravel);
  const left = clamp(-lateralAccel * p.susLatGain, -p.maxTravel, p.maxTravel);
  const right = clamp(lateralAccel * p.susLatGain, -p.maxTravel, p.maxTravel);
  // Combine the two axes, then clamp the result so a simultaneous hard brake
  // AND hard cornering cannot exceed the physical suspension travel.
  return {
    FL: clamp(front + left, -p.maxTravel, p.maxTravel),
    FR: clamp(front + right, -p.maxTravel, p.maxTravel),
    RL: clamp(rear + left, -p.maxTravel, p.maxTravel),
    RR: clamp(rear + right, -p.maxTravel, p.maxTravel),
  };
}

/**
 * Yaw rate from the bicycle model (matches carMovement.stepCar).
 * Kept here so visual effects stay consistent with the physics body without
 * importing the movement module.
 */
export function yawRate(speed, steerAngle, wheelbase) {
  return -(speed * Math.tan(steerAngle)) / wheelbase;
}
