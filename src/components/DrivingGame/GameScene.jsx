// =============================================================================
// GameScene — 3D driving practice with React Three Fiber + Rapier.
// All game state lives in the physics loop; parent just renders UI.
// =============================================================================

import { useRef, useEffect, useCallback, useMemo, Suspense, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { stepCar, carCorners, footprintInsideBox } from "../../physics/carMovement";
import { getTrack, CAR_DIMENSIONS } from "../../physics/tracks";
import { createInputManager } from "../../physics/input";
import GltfCar from "./GltfCar";

const CAR_LEN = CAR_DIMENSIONS.length;
const CAR_WID = CAR_DIMENSIONS.width;
const CAR_HALF_LEN = CAR_LEN / 2;
const CAR_HALF_WID = CAR_WID / 2;

/* ── Preload the GLB so it is ready before the first frame. ── */
useGLTF.preload("/models/wagonR.glb");

function ConeMesh() {
  return (
    <mesh position={[0, 0.4, 0]} castShadow>
      <coneGeometry args={[0.3, 0.8, 12]} />
      <meshStandardMaterial color="#FF6201" roughness={0.7} />
    </mesh>
  );
}

function WallMesh({ w, d }) {
  return (
    <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.6, d]} />
      <meshStandardMaterial color="#555" roughness={0.9} />
    </mesh>
  );
}

function FinishZone({ finish, active }) {
  return (
    <mesh position={[finish.x + finish.w / 2, 0.02, finish.z + finish.d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[finish.w, finish.d]} />
      <meshStandardMaterial
        color={active ? "#22c55e" : "#fbbf24"}
        transparent
        opacity={active ? 0.6 : 0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RoadMesh({ seg }) {
  return (
    <mesh position={[seg.x, 0.01, seg.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[seg.w, seg.d]} />
      <meshStandardMaterial color="#5a5a6e" roughness={0.95} />
    </mesh>
  );
}

function CheckpointMesh({ cp, reached }) {
  const color = reached ? "#22c55e" : "#3b82f6";
  const opacity = reached ? 0.45 : 0.25;
  return (
    <mesh position={[cp.x + cp.w / 2, 0.03, cp.z + cp.d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[cp.w, cp.d]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Ground({ size }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#444" roughness={0.95} />
    </mesh>
  );
}

/* ── Car controller ── */
function CarController({ track, onState, carRef, resetSignal }) {
  const { camera } = useThree();
  const localCarRef = useRef(null);
  const inputRef = useRef(null);

  const speedRef = useRef(0);
  const headingRef = useRef(0);
  const steerRef = useRef(0);
  const steerAngleRef = useRef(0);
  const brakeRef = useRef(0);
  const reverseRef = useRef(0);
  const flashingRef = useRef(false);
  const hitHandlesRef = useRef(new Map());
  const flashUntilRef = useRef(0);
  const stopTimerRef = useRef(0);
  const frozenRef = useRef(false);
  const hitsRef = useRef(0);
  // Checkpoint progress: index of the next required checkpoint.
  const cpIndexRef = useRef(0);

  // Input manager
  useEffect(() => {
    const mgr = createInputManager();
    mgr.start();
    inputRef.current = mgr;
    return () => mgr.stop();
  }, []);

  // Expose ref
  useEffect(() => {
    if (carRef) carRef.current = localCarRef.current;
  }, [carRef]);

  // Reset: restore car to start, clear all progress. Triggered when resetSignal changes.
  useEffect(() => {
    const body = localCarRef.current;
    if (!body) return;
    frozenRef.current = false;
    speedRef.current = 0;
    headingRef.current = track.start.heading;
    steerRef.current = 0;
    steerAngleRef.current = 0;
    brakeRef.current = 0;
    reverseRef.current = 0;
    flashUntilRef.current = 0;
    flashingRef.current = false;
    stopTimerRef.current = 0;
    hitsRef.current = 0;
    cpIndexRef.current = 0;
    hitHandlesRef.current = new Map();
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setTranslation({ x: track.start.x, y: 0.5, z: track.start.z }, true);
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      track.start.heading
    );
    body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  }, [resetSignal, track.start.x, track.start.z, track.start.heading]);

  const handleCollision = useCallback((event) => {
    if (frozenRef.current) return;
    const now = performance.now();
    const objId = event.other.rigidBodyObject?.id ?? 0;
    const lastHit = hitHandlesRef.current.get(objId) || 0;
    if (now - lastHit > 500) {
      hitHandlesRef.current.set(objId, now);
      flashUntilRef.current = now + 300;
      hitsRef.current += 1;
    }
  }, []);

  useFrame((state, delta) => {
    const body = localCarRef.current;
    const input = inputRef.current;
    if (!body || !input) return;

    const dt = Math.min(delta, 1 / 30);

    // Read physics state
    const pos = body.translation();
    const rot = body.rotation();
    const vel = body.linvel();

    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w), "YXZ"
    );
    const currentHeading = euler.y;

    const fwdX = Math.sin(currentHeading);
    const fwdZ = Math.cos(currentHeading);
    const currentSpeed = vel.x * fwdX + vel.z * fwdZ;

    // Step physics
    if (!frozenRef.current) {
      const carInput = input.getInput();
      const { speed: newSpeed, heading: newHeading, steerAngle } = stepCar(
        { speed: currentSpeed, heading: currentHeading, steerAngle: steerAngleRef.current },
        carInput,
        dt
      );
      speedRef.current = newSpeed;
      headingRef.current = newHeading;
      steerAngleRef.current = steerAngle;

      // Drive the visual model: steer input + derived brake/reverse state.
      steerRef.current = carInput.steer;
      // Brake lights: throttle opposes current motion (e.g. pressing S while moving forward).
      brakeRef.current =
        (carInput.throttle < 0 && currentSpeed > 0.1) ||
        (carInput.throttle > 0 && currentSpeed < -0.1)
          ? 1
          : 0;
      // Reverse lights: moving backward.
      reverseRef.current = newSpeed < -0.1 ? 1 : 0;

      body.setLinvel(
        { x: Math.sin(newHeading) * newSpeed, y: 0, z: Math.cos(newHeading) * newSpeed },
        true
      );
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), newHeading);
      body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      // Kill residual angular velocity every frame so a stopped car cannot
      // accumulate yaw drift from prior turning or collisions (angularDamping=0).
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      steerRef.current = 0;
      steerAngleRef.current = 0;
      brakeRef.current = 0;
      reverseRef.current = 0;
    }

    // Completion detection
    const corners = carCorners(pos.x, pos.z, headingRef.current, CAR_LEN, CAR_WID);
    const inside = footprintInsideBox(corners, track.finish);
    const slowEnough = Math.abs(speedRef.current) < 0.3;
    const now = performance.now();
    const flashing = now < flashUntilRef.current;
    flashingRef.current = flashing;

    // Checkpoint tracking — advance through ordered gates as the car's
    // footprint overlaps each one in sequence.
    const checkpoints = track.checkpoints || [];
    if (cpIndexRef.current < checkpoints.length &&
        footprintInsideBox(corners, checkpoints[cpIndexRef.current])) {
      cpIndexRef.current += 1;
    }
    const allCpReached = cpIndexRef.current >= checkpoints.length;

    let completionStatus = "playing";
    if (inside && slowEnough && !frozenRef.current && allCpReached) {
      stopTimerRef.current += dt;
      if (stopTimerRef.current >= 0.5) {
        frozenRef.current = true;
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        completionStatus = hitsRef.current === 0 ? "completed" : "parked-dirty";
      }
    } else if (!inside || !slowEnough) {
      stopTimerRef.current = 0;
    }

    // Camera follow — ~50% closer than before (9→4.5, 5→2.5).
    const camDist = 4.5;
    const camHeight = 2.5;
    const behindX = pos.x - Math.sin(headingRef.current) * camDist;
    const behindZ = pos.z - Math.cos(headingRef.current) * camDist;
    camera.position.lerp(new THREE.Vector3(behindX, camHeight, behindZ), 0.08);
    camera.lookAt(pos.x, 0.5, pos.z);

    // Report state to parent
    onState?.({
      hits: hitsRef.current,
      status: completionStatus,
      flashing,
      frozen: frozenRef.current,
      cpReached: cpIndexRef.current,
      cpTotal: checkpoints.length,
    });
  });

  return (
    <RigidBody
      ref={localCarRef}
      type="dynamic"
      position={[track.start.x, 0.5, track.start.z]}
      rotation={[0, track.start.heading, 0]}
      enabledRotations={[false, true, false]}
      enabledTranslations={[true, false, true]}
      linearDamping={0}
      angularDamping={0}
      onCollisionStart={handleCollision}
      colliders={false}
    >
      {/* Collider half-extents [halfX, halfY, halfZ]: body is CAR_WID wide (X), CAR_LEN long (Z). */}
      <CuboidCollider args={[CAR_HALF_WID, 0.4, CAR_HALF_LEN]} />
      <Suspense fallback={null}>
        <GltfCar
          bodyColor="#2563eb"
          steerRef={steerAngleRef}
          speedRef={speedRef}
          brakeRef={brakeRef}
          reverseRef={reverseRef}
          flashingRef={flashingRef}
        />
      </Suspense>
    </RigidBody>
  );
}

/* ── Track renderer ── */
function TrackObjects({ track, cpReached }) {
  return (
    <group>
      <Ground size={track.groundSize} />

      {/* Road surface — asphalt planes distinct from the ground. */}
      {(track.roadSegments || []).map((seg, i) => (
        <RoadMesh key={`r${i}`} seg={seg} />
      ))}

      <gridHelper args={[track.groundSize, track.groundSize, 0x888888, 0x666666]} position={[0, 0.01, 0]} />

      {track.walls.map((wall, i) => (
        <RigidBody key={`w${i}`} type="fixed" position={[wall.x, 0, wall.z]} colliders={false}>
          <CuboidCollider args={[wall.w / 2, 0.3, wall.d / 2]} />
          <WallMesh w={wall.w} d={wall.d} />
        </RigidBody>
      ))}

      {track.cones.map((cone, i) => (
        <RigidBody key={`c${i}`} type="fixed" position={[cone.x, 0, cone.z]} colliders={false}>
          <CuboidCollider args={[0.3, 0.4, 0.3]} />
          <ConeMesh />
        </RigidBody>
      ))}

      {(track.parkedCars || []).map((car, i) => (
        <RigidBody key={`p${i}`} type="fixed" position={[car.x, 0.5, car.z]} rotation={[0, car.heading, 0]} colliders={false}>
          <CuboidCollider args={[CAR_HALF_WID, 0.4, CAR_HALF_LEN]} />
          <Suspense fallback={null}>
            {/* Parked cars are static — different colours so they read as other vehicles. */}
            <GltfCar bodyColor={["#dc2626", "#16a34a", "#a16207"][i % 3]} />
          </Suspense>
        </RigidBody>
      ))}

      {/* Ordered checkpoint gates — turn green as the car reaches each one. */}
      {(track.checkpoints || []).map((cp, i) => (
        <CheckpointMesh key={`cp${i}`} cp={cp} reached={i < cpReached} />
      ))}

      <FinishZone finish={track.finish} active={false} />
    </group>
  );
}

/* ── Main scene ── */
export default function GameScene({ mode, onState, carRef, resetSignal }) {
  const track = useMemo(() => getTrack(mode), [mode]);
  // Track checkpoint progress for rendering (lifted to state so visuals update).
  const [cpReached, setCpReached] = useState(0);
  const wrappedOnState = useCallback((s) => {
    setCpReached(s.cpReached);
    onState?.(s);
  }, [onState]);

  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <TrackObjects track={track} cpReached={cpReached} />
      <CarController
        track={track}
        onState={wrappedOnState}
        carRef={carRef}
        resetSignal={resetSignal}
      />
    </Physics>
  );
}
