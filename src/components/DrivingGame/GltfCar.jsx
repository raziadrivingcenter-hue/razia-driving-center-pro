/* eslint-disable react-hooks/immutability */
// This component collects imperative THREE.js handles (meshes, materials)
// during render and mutates their properties every frame (rotation, emissive)
// inside useFrame. Those are scene-graph mutations, not React state changes —
// the immutability rule cannot tell the difference, so it is disabled here.

// =============================================================================
// GltfCar — loads the Sketchfab Suzuki Wagon R GLB and renders it as a
// visual-only child of the existing Rapier RigidBody. The physics body and
// collider are untouched; this component only drives the visual model.
//
// Front wheels steer with Ackermann geometry (inside wheel turns more sharply).
// All wheels roll according to distance travelled. Brake / reverse lights
// respond to game state passed in via refs so the parent never re-renders.
//
// Visual suspension (body roll / pitch) is a damped interpolation — NOT real
// physics. It reads the physics-derived speed and steering angle to produce
// subtle body movement. The wheels remain attached to the body group, so
// they tilt slightly with roll/pitch; this is an acceptable approximation at
// the low speeds of a driving-school test.
// =============================================================================
import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CAR_DIMENSIONS } from "../../physics/tracks";
import { CONFIG } from "../../physics/carMovement";
import {
  SUSPENSION_PARAMS,
  dampSpring,
  computeBodyRoll,
  computeBodyPitch,
} from "../../physics/suspension";

const CAR_LEN = CAR_DIMENSIONS.length;
const CAR_WID = CAR_DIMENSIONS.width;

// Wheel node names. GLTFLoader strips dots from glTF names, so the glTF nodes
// "wheel", "wheel.001", "wheel.002", "wheel.003" become:
// Verified from GLB inspection (model space, +Z = front, +X = left, -X = right):
// Verified from GLB world-position inspection (chassis_ok applies a 180°
// flip that maps local +Z to world -Z, so the wheels with local +Z end up
// at world -Z = rear). World positions: wheel(-0.806,0.368,+1.427)=FL,
// wheel003(+0.779,0.368,+1.429)=FR, wheel001(-0.806,0.385,-1.370)=RL,
// wheel002(+0.779,0.385,-1.372)=RR.
const FL = "wheel";    // front-left  (world x<0, z>0)
const FR = "wheel003"; // front-right (world x>0, z>0)
const RL = "wheel001"; // rear-left   (world x<0, z<0)
const RR = "wheel002"; // rear-right  (world x>0, z<0)
const ALL_WHEELS = [FL, FR, RL, RR];

// Physics wheelbase (must match CONFIG.wheelbase used by carMovement).
const PHYSICS_WHEELBASE = CONFIG.wheelbase;

// Visual wheelbase and track width in model space (from GLB inspection).
// Front axle at z≈1.447, rear axle at z≈-1.353, left wheels at x≈0.769,
// right wheels at x≈-0.815.
const VISUAL_WHEELBASE = 2.8;
const VISUAL_TRACK_WIDTH = 1.584;

// Tyre contact radius (wheel_2 submesh is 0.687m diameter).
const WHEEL_RADIUS = 0.344;

/** Deep-clone a loaded scene so each car instance owns its materials. */
function cloneSceneDeep(scene) {
  const cloned = scene.clone(true);
  cloned.traverse((obj) => {
    if (obj.material) {
      obj.material = Array.isArray(obj.material)
        ? obj.material.map((m) => m.clone())
        : obj.material.clone();
    }
  });
  return cloned;
}

export default function GltfCar({
  bodyColor = "#e7e7e7",
  steerRef,
  speedRef,
  brakeRef,
  reverseRef,
  flashingRef,
}) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const scaleRef = useRef(1);
  const speedPrevRef = useRef(0);
  const rollRef = useRef(0);
  const pitchRef = useRef(0);
  const { scene } = useGLTF("/models/wagonR.glb");

  // One deep clone per instance so material/animation state is independent.
  // We also collect wheel handles + light materials here (during render) so
  // useFrame can mutate them without tripping react-hooks immutability rules.
  //
  // Wheel hierarchy is restructured into isolated pivot groups so the wheel
  // group's fixed base transform (camber + mirror scale ± Z-flip) is never
  // modified by per-frame steering/rolling:
  //
  //   Front:  steerPivot (Y = steer) → wheelGroup (fixed) → rollPivot (X = roll) → meshes
  //   Rear:   wheelGroup (fixed) → rollPivot (X = roll) → meshes
  //
  // Left wheels have a Z=π flip that inverts Y (steering) and X (rolling);
  // the signs in useFrame compensate so all wheels behave identically.
  const { clonedScene, steerPivots, rollPivots, bodyMat, brakeMats, reverseMats } = useMemo(() => {
    const cloned = cloneSceneDeep(scene);
    const foundWheels = {};
    let bodyMat = null;
    const brakeMats = [];
    const reverseMats = [];

    cloned.traverse((obj) => {
      if (ALL_WHEELS.includes(obj.name)) {
        foundWheels[obj.name] = obj;
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          const n = mat.name?.toLowerCase() ?? "";
          if (n === "car paint") bodyMat = mat;
          if (n.includes("breaklight")) {
            if (!mat.emissive) mat.emissive = new THREE.Color();
            mat.emissive.setHex(0xcc0000);
            mat.emissiveIntensity = 0.05;
            brakeMats.push(mat);
          }
          if (n.includes("revlight")) {
            if (!mat.emissive) mat.emissive = new THREE.Color();
            mat.emissive.setHex(0xffffff);
            mat.emissiveIntensity = 0;
            reverseMats.push(mat);
          }
        });
      }
    });

    // Build steering + rolling pivot groups for each wheel.
    const steerPivots = {};
    const rollPivots = {};
    for (const name of ALL_WHEELS) {
      const wheel = foundWheels[name];
      if (!wheel) continue;

      // Rolling pivot: child of the wheel group, holds the mesh children.
      // Isolates rolling (X rotation) from the wheel group's fixed base
      // transform so the camber angle never drifts as the wheel rolls.
      const rollPivot = new THREE.Group();
      rollPivot.name = `${name}_roll`;
      while (wheel.children.length > 0) {
        rollPivot.add(wheel.children[0]);
      }
      wheel.add(rollPivot);
      rollPivots[name] = rollPivot;

      // Steering pivot: front wheels only. Inserted above the wheel group so
      // steering (Y rotation) is applied before the wheel group's base
      // transform (Z=π flip on left wheels inverts Y).
      const parent = wheel.parent;
      const savedPos = wheel.position.clone();
      if (name === FL || name === FR) {
        parent.remove(wheel);
        const steerPivot = new THREE.Group();
        steerPivot.name = `${name}_steer`;
        steerPivot.position.copy(savedPos);
        steerPivot.add(wheel);
        wheel.position.set(0, 0, 0);
        parent.add(steerPivot);
        steerPivots[name] = steerPivot;
      }
    }

    return { clonedScene: cloned, steerPivots, rollPivots, bodyMat, brakeMats, reverseMats };
  }, [scene]);

  // Apply body colour when it changes.
  useEffect(() => {
    if (bodyMat) bodyMat.color.set(bodyColor);
  }, [bodyColor, bodyMat]);

  // Position & scale the model so it sits inside the existing collider.
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = Math.min(CAR_WID / size.x, CAR_LEN / size.z);
    const g = groupRef.current;
    if (!g) return;
    g.scale.setScalar(scale);
    g.position.set(
      -center.x * scale,        // centre left-right
      -0.4 - box.min.y * scale, // lowest point at collider bottom
      -center.z * scale         // centre front-rear
    );
    scaleRef.current = scale;
  }, [clonedScene]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const steerAngle = steerRef?.current ?? 0;
    const speed = speedRef?.current ?? 0;
    const braking = (brakeRef?.current ?? 0) > 0;
    const reversing = (reverseRef?.current ?? 0) > 0;
    const flashing = flashingRef?.current ?? false;
    const scale = scaleRef.current;

    // --- Ackermann steering (front wheels only) ---
    // Applied to the steeringPivot (parent of the wheel group) so it happens
    // before the wheel group's base transform. Left wheels carry a Z=π flip
    // that inverts Y rotation, so their steering angle is negated to compensate.
    const visualSteer = steerAngle * (VISUAL_WHEELBASE / PHYSICS_WHEELBASE);
    const absSteer = Math.abs(visualSteer);

    if (absSteer > 0.0001) {
      // Turning radius at the rear axle centre.
      const R = VISUAL_WHEELBASE / Math.tan(absSteer);
      // Clamp R so the denominator stays positive for the inner wheel.
      const clampedR = Math.max(R, VISUAL_TRACK_WIDTH / 2 + 0.1);
      const innerAngle = Math.atan(VISUAL_WHEELBASE / (clampedR - VISUAL_TRACK_WIDTH / 2));
      const outerAngle = Math.atan(VISUAL_WHEELBASE / (clampedR + VISUAL_TRACK_WIDTH / 2));

      if (visualSteer > 0) {
        // Right turn: FR (right side) is inner, FL (left side) is outer.
        // The chassis 180° flip means +Y rotation steers toward +X (car-left),
        // so both wheels must be negated to steer toward -X (car-right).
        if (steerPivots[FR]) steerPivots[FR].rotation.y = -innerAngle;
        if (steerPivots[FL]) steerPivots[FL].rotation.y = -outerAngle;
      } else {
        // Left turn: FL (left side) is inner, FR (right side) is outer.
        // Both positive → steer toward +X (car-left).
        if (steerPivots[FL]) steerPivots[FL].rotation.y = innerAngle;
        if (steerPivots[FR]) steerPivots[FR].rotation.y = outerAngle;
      }
    } else {
      if (steerPivots[FL]) steerPivots[FL].rotation.y = 0;
      if (steerPivots[FR]) steerPivots[FR].rotation.y = 0;
    }

    // --- Rolling (all wheels) ---
    // Applied to the rollingPivot (child of the wheel group) so it happens
    // after the wheel group's base transform. Right wheels: mirror scale
    // inverts X → subtract for forward roll. Left wheels: Z=π + mirror scale
    // = double inversion → add for forward roll.
    const dAngle = (speed * dt) / (WHEEL_RADIUS * scale);
    if (rollPivots[FL]) rollPivots[FL].rotation.x += dAngle;
    if (rollPivots[RL]) rollPivots[RL].rotation.x += dAngle;
    if (rollPivots[FR]) rollPivots[FR].rotation.x -= dAngle;
    if (rollPivots[RR]) rollPivots[RR].rotation.x -= dAngle;

    // --- Brake lights ---
    for (const mat of brakeMats) {
      mat.emissiveIntensity = braking ? 2.0 : 0.05;
    }
    // --- Reverse lights ---
    for (const mat of reverseMats) {
      mat.emissiveIntensity = reversing ? 1.5 : 0;
    }

    // --- Collision flash (paint pulses red) ---
    if (bodyMat) {
      if (flashing) {
        const pulse = (Math.sin(state.clock.elapsedTime * 14) + 1) / 2;
        if (!bodyMat.emissive) bodyMat.emissive = new THREE.Color();
        bodyMat.emissive.setHex(0xff0000);
        bodyMat.emissiveIntensity = 0.4 + pulse * 0.6;
      } else {
        bodyMat.emissiveIntensity = 0;
      }
    }

    // --- Visual suspension: body roll & pitch ---
    // All targets come from pure functions in physics/suspension.js so the
    // maths are unit-testable. Pitch sign is corrected here: acceleration
    // (longAccel > 0) must raise the nose (negative rotation.x), braking dips
    // it (positive rotation.x). computeBodyPitch already encodes this.
    const yr = -(speed * Math.tan(steerAngle)) / PHYSICS_WHEELBASE;
    const lateralAccel = speed * yr;

    const longAccel = (speed - speedPrevRef.current) / dt;
    speedPrevRef.current = speed;

    const targetRoll = computeBodyRoll(lateralAccel, SUSPENSION_PARAMS);
    const targetPitch = computeBodyPitch(longAccel, SUSPENSION_PARAMS);

    rollRef.current = dampSpring(rollRef.current, targetRoll, SUSPENSION_PARAMS.rollResponse, dt);
    pitchRef.current = dampSpring(pitchRef.current, targetPitch, SUSPENSION_PARAMS.pitchResponse, dt);

    if (bodyRef.current) {
      bodyRef.current.rotation.z = rollRef.current;
      bodyRef.current.rotation.x = pitchRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* bodyRef holds the visual suspension offset; clonedScene is its child. */}
      <group ref={bodyRef}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}
