// =============================================================================
// GameScene — 3D driving practice with React Three Fiber + Rapier.
// All game state lives in the physics loop; parent just renders UI.
// =============================================================================

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

import { stepCar, carCorners, footprintInsideBox } from "../../physics/carMovement";
import { getTrack, CAR_DIMENSIONS } from "../../physics/tracks";
import { createInputManager } from "../../physics/input";

const CAR_LEN = CAR_DIMENSIONS.length;
const CAR_WID = CAR_DIMENSIONS.width;
const CAR_HALF_LEN = CAR_LEN / 2;
const CAR_HALF_WID = CAR_WID / 2;

/* ── Meshes ── */
function CarMesh({ flashing }) {
  const bodyColor = flashing ? "#dc2626" : "#2563eb";
  return (
    <group>
      {/* Long axis along local +Z to match heading convention (heading 0 = +Z).
          Three.js boxGeometry args = [width(X), height(Y), depth(Z)].
          CAR_LEN is the body depth (Z); CAR_WID is the body width (X). */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[CAR_WID, 0.5, CAR_LEN]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Cabin — length along Z to match the body. */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[CAR_WID * 0.8, 0.4, CAR_LEN * 0.45]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Wheels — width along X, length along Z. Axle (cylinder axis) along X. */}
      {[[CAR_HALF_WID, CAR_HALF_LEN * 0.7], [CAR_HALF_WID, -CAR_HALF_LEN * 0.7],
        [-CAR_HALF_WID, CAR_HALF_LEN * 0.7], [-CAR_HALF_WID, -CAR_HALF_LEN * 0.7]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
            <meshStandardMaterial color="#111" roughness={0.8} />
          </mesh>
        ))}
    </group>
  );
}

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

function Ground({ size }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#444" roughness={0.95} />
    </mesh>
  );
}

/* ── Car controller ── */
function CarController({ track, onState, carRef }) {
  const { camera } = useThree();
  const localCarRef = useRef(null);
  const inputRef = useRef(null);

  const speedRef = useRef(0);
  const headingRef = useRef(0);
  const hitHandlesRef = useRef(new Map());
  const flashUntilRef = useRef(0);
  const stopTimerRef = useRef(0);
  const frozenRef = useRef(false);
  const hitsRef = useRef(0);

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
      const { speed: newSpeed, heading: newHeading } = stepCar(
        { speed: currentSpeed, heading: currentHeading },
        carInput,
        dt
      );
      speedRef.current = newSpeed;
      headingRef.current = newHeading;

      body.setLinvel(
        { x: Math.sin(newHeading) * newSpeed, y: 0, z: Math.cos(newHeading) * newSpeed },
        true
      );
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), newHeading);
      body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    }

    // Completion detection
    const corners = carCorners(pos.x, pos.z, headingRef.current, CAR_LEN, CAR_WID);
    const inside = footprintInsideBox(corners, track.finish);
    const slowEnough = Math.abs(speedRef.current) < 0.3;
    const now = performance.now();
    const flashing = now < flashUntilRef.current;

    let completionStatus = "playing";
    if (inside && slowEnough && !frozenRef.current) {
      stopTimerRef.current += dt;
      if (stopTimerRef.current >= 0.5) {
        frozenRef.current = true;
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        completionStatus = hitsRef.current === 0 ? "completed" : "parked-dirty";
      }
    } else if (!inside || !slowEnough) {
      stopTimerRef.current = 0;
    }

    // Camera follow
    const camDist = 9;
    const camHeight = 5;
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
      <CarMesh flashing={false} />
    </RigidBody>
  );
}

/* ── Track renderer ── */
function TrackObjects({ track }) {
  return (
    <group>
      <Ground size={track.groundSize} />
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
          <CarMesh flashing={false} />
        </RigidBody>
      ))}

      <FinishZone finish={track.finish} active={false} />
    </group>
  );
}

/* ── Main scene ── */
export default function GameScene({ mode, onState, carRef }) {
  const track = useMemo(() => getTrack(mode), [mode]);

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

      <TrackObjects track={track} />
      <CarController track={track} onState={onState} carRef={carRef} />
    </Physics>
  );
}
