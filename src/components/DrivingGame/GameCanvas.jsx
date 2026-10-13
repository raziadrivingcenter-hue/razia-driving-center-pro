// =============================================================================
// GameCanvas — 3D driving practice (L-Track + Parking).
// Three.js: cones, car model, shadows, third-person follow camera.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/* ── World constants ── */
const CAR_LEN = 4.2;
const CAR_WID = 2.0;
const CAR_HEIGHT = 1.4;

const ACCEL = 8;
const BRAKE = 12;
const FRICTION = 1.5;
const MAX_FWD = 14;
const MAX_REV = -7;
const TURN_RATE = 1.8; // radians/sec at full steer

/* ── Level definitions ── */
function getLevel(mode) {
  if (mode === "ltrack") {
    return {
      cones: [
        // L-Track outer boundary
        { x: -6, z: -10 }, { x: -2, z: -10 }, { x: 2, z: -10 },
        { x: 6, z: -10 }, { x: 10, z: -10 }, { x: 14, z: -10 },
        { x: 14, z: -6 }, { x: 14, z: -2 }, { x: 14, z: 2 },
        { x: 14, z: 6 }, { x: 14, z: 10 },
        { x: 10, z: 10 }, { x: 6, z: 10 }, { x: 2, z: 10 },
        { x: -2, z: 10 }, { x: -6, z: 10 },
        // Inner L dividers
        { x: -6, z: 6 }, { x: -2, z: 6 }, { x: 2, z: 6 },
        { x: 6, z: 6 }, { x: 6, z: 2 }, { x: 6, z: -2 },
      ],
      walls: [],
      finish: { x: -4, z: -8, w: 6, d: 4 },
      car: { x: 12, z: 0, angle: Math.PI, speed: 0 },
      groundSize: 40,
    };
  }

  // Parking
  return {
    cones: [
      { x: -8, z: -4 }, { x: -4, z: -4 }, { x: 0, z: -4 },
      { x: 0, z: 0 }, { x: 0, z: 4 },
      { x: -8, z: 4 }, { x: -4, z: 4 },
      { x: 6, z: -2 }, { x: 8, z: 2 }, { x: 10, z: -3 },
      { x: 4, z: 5 }, { x: 12, z: 4 },
    ],
    walls: [
      { x: -4, z: -4, w: 8, d: 0.3 },
      { x: -8, z: 0, w: 0.3, d: 8 },
    ],
    finish: { x: -6, z: -2, w: 4, d: 4 },
    car: { x: 10, z: 6, angle: Math.PI, speed: 0 },
    groundSize: 40,
  };
}

/* ── Build a 3D car mesh ── */
function buildCar() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(CAR_LEN, CAR_HEIGHT * 0.5, CAR_WID);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.3, roughness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = CAR_HEIGHT * 0.45;
  body.castShadow = true;
  group.add(body);

  const cabinGeo = new THREE.BoxGeometry(CAR_LEN * 0.5, CAR_HEIGHT * 0.4, CAR_WID * 0.85);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.2, roughness: 0.4 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-0.2, CAR_HEIGHT * 0.85, 0);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const wheelPositions = [
    { x: CAR_LEN * 0.35, z: CAR_WID * 0.5 },
    { x: CAR_LEN * 0.35, z: -CAR_WID * 0.5 },
    { x: -CAR_LEN * 0.35, z: CAR_WID * 0.5 },
    { x: -CAR_LEN * 0.35, z: -CAR_WID * 0.5 },
  ];
  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.4, pos.z);
    wheel.castShadow = true;
    group.add(wheel);
  }

  const lightGeo = new THREE.BoxGeometry(0.15, 0.2, 0.3);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeebb, emissive: 0xffeebb, emissiveIntensity: 0.5 });
  for (const zOff of [-0.6, 0.6]) {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(CAR_LEN / 2 + 0.01, CAR_HEIGHT * 0.45, zOff);
    group.add(light);
  }

  return group;
}

/* ── Build a cone mesh ── */
function buildCone() {
  const geo = new THREE.ConeGeometry(0.4, 1.0, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff6201, roughness: 0.7 });
  const cone = new THREE.Mesh(geo, mat);
  cone.position.y = 0.5;
  cone.castShadow = true;
  return cone;
}

/* ── Build a wall mesh ── */
function buildWall(w, h, d, color = 0x666666) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.y = h / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

/* ── Component ── */
export default function GameCanvas({ mode }) {
  const containerRef = useRef(null);
  const keysRef = useRef({});
  const levelRef = useRef(null);
  const hitsRef = useRef(0);
  const hitFlashRef = useRef(0);
  const completedRef = useRef(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const carMeshRef = useRef(null);
  const finishMeshRef = useRef(null);
  const coneMeshesRef = useRef([]);
  const rafRef = useRef(0);
  const clockRef = useRef(null);
  const speedRef = useRef(0);
  const modeRef = useRef(mode);

  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState(false);

  // Keep modeRef in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const reset = useCallback(() => {
    const level = getLevel(modeRef.current);
    levelRef.current = level;
    if (carMeshRef.current) {
      carMeshRef.current.position.set(level.car.x, 0, level.car.z);
      carMeshRef.current.rotation.y = level.car.angle;
    }
    speedRef.current = 0;
    hitsRef.current = 0;
    hitFlashRef.current = 0;
    completedRef.current = false;
    setHits(0);
    setDone(false);
    setFlash(false);
    if (finishMeshRef.current) {
      finishMeshRef.current.material.color.setHex(0xfbbf24);
      finishMeshRef.current.material.opacity = 0.4;
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
        keysRef.current[k] = true;
      }
    };
    const up = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Three.js setup — runs once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 80);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, 800 / 500, 0.1, 200);
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    scene.add(sun);

    const level = getLevel(modeRef.current);
    const groundSize = level.groundSize;

    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(groundSize, groundSize, 0x888888, 0x666666);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const carMesh = buildCar();
    carMesh.position.set(level.car.x, 0, level.car.z);
    carMesh.rotation.y = level.car.angle;
    scene.add(carMesh);
    carMeshRef.current = carMesh;

    coneMeshesRef.current = [];
    for (const conePos of level.cones) {
      const cone = buildCone();
      cone.position.set(conePos.x, 0, conePos.z);
      scene.add(cone);
      coneMeshesRef.current.push({ mesh: cone, x: conePos.x, z: conePos.z });
    }

    for (const wall of level.walls) {
      const wallMesh = buildWall(wall.w, 1.5, wall.d);
      wallMesh.position.set(wall.x, 0, wall.z);
      scene.add(wallMesh);
    }

    const finishGeo = new THREE.PlaneGeometry(level.finish.w, level.finish.d);
    const finishMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const finishMesh = new THREE.Mesh(finishGeo, finishMat);
    finishMesh.rotation.x = -Math.PI / 2;
    finishMesh.position.set(
      level.finish.x + level.finish.w / 2,
      0.02,
      level.finish.z + level.finish.d / 2
    );
    scene.add(finishMesh);
    finishMeshRef.current = finishMesh;

    levelRef.current = level;
    clockRef.current = new THREE.Clock();

    // Game loop
    function frame() {
      const dt = Math.min(clockRef.current ? clockRef.current.getDelta() : 0.016, 0.05);
      const car = carMeshRef.current;
      const lvl = levelRef.current;
      if (!car || !lvl) {
        rafRef.current = requestAnimationFrame(frame);
        renderer.render(scene, camera);
        return;
      }

      const keys = keysRef.current;

      // --- Physics ---
      if (keys["arrowup"] || keys["w"]) {
        speedRef.current = Math.min(speedRef.current + ACCEL * dt, MAX_FWD);
      } else if (keys["arrowdown"] || keys["s"]) {
        speedRef.current = Math.max(speedRef.current - BRAKE * dt, MAX_REV);
      } else {
        if (speedRef.current > 0) speedRef.current = Math.max(0, speedRef.current - FRICTION * dt);
        else if (speedRef.current < 0) speedRef.current = Math.min(0, speedRef.current + FRICTION * dt);
      }

      // Steering
      if (Math.abs(speedRef.current) > 0.3) {
        const dir = speedRef.current > 0 ? 1 : -1;
        const steer = TURN_RATE * dt * dir;
        if (keys["arrowleft"] || keys["a"]) car.rotation.y += steer;
        if (keys["arrowright"] || keys["d"]) car.rotation.y -= steer;
      }

      // Move
      const vx = Math.sin(car.rotation.y) * speedRef.current * dt;
      const vz = Math.cos(car.rotation.y) * speedRef.current * dt;
      car.position.x += vx;
      car.position.z += vz;

      // Keep car on ground area
      const bound = groundSize / 2 - 2;
      car.position.x = Math.max(-bound, Math.min(bound, car.position.x));
      car.position.z = Math.max(-bound, Math.min(bound, car.position.z));

      // --- Collision ---
      const carHalfLen = CAR_LEN / 2 + 0.3;
      const carHalfWid = CAR_WID / 2 + 0.3;
      let hit = false;
      for (const cone of coneMeshesRef.current) {
        const dx = Math.abs(car.position.x - cone.x);
        const dz = Math.abs(car.position.z - cone.z);
        if (dx < carHalfLen + 0.4 && dz < carHalfWid + 0.4) {
          hit = true;
          break;
        }
      }

      if (hit && hitFlashRef.current <= 0 && !completedRef.current) {
        hitsRef.current += 1;
        hitFlashRef.current = 0.5;
        setHits(hitsRef.current);
        setFlash(true);
      }
      if (hitFlashRef.current > 0) {
        hitFlashRef.current -= dt;
        if (hitFlashRef.current <= 0) setFlash(false);
      }

      // Flash car red
      car.traverse((child) => {
        if (child.isMesh && child.material) {
          if (hitFlashRef.current > 0 && !completedRef.current) {
            child.material.emissive = new THREE.Color(0xff0000);
            child.material.emissiveIntensity = 0.4;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });

      // --- Completion ---
      const f = lvl.finish;
      const carX = car.position.x;
      const carZ = car.position.z;
      const insideFinish =
        carX > f.x && carX < f.x + f.w && carZ > f.z && carZ < f.z + f.d;

      if (!completedRef.current && insideFinish && Math.abs(speedRef.current) < 0.5) {
        completedRef.current = true;
        setDone(true);
        if (finishMeshRef.current) {
          finishMeshRef.current.material.color.setHex(0x22c55e);
          finishMeshRef.current.material.opacity = 0.6;
        }
      }

      // --- Camera follow ---
      const camDist = 10;
      const camHeight = 6;
      const behindX = car.position.x - Math.sin(car.rotation.y) * camDist;
      const behindZ = car.position.z - Math.cos(car.rotation.y) * camDist;
      camera.position.lerp(
        new THREE.Vector3(behindX, camHeight, behindZ),
        0.08
      );
      camera.lookAt(car.position.x, 1, car.position.z);

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle mode change by rebuilding the scene
  useEffect(() => {
    // Rebuild scene for new mode
    const container = containerRef.current;
    if (!container || !sceneRef.current) return;

    // Remove old cones
    for (const c of coneMeshesRef.current) {
      sceneRef.current.remove(c.mesh);
    }
    coneMeshesRef.current = [];

    const level = getLevel(mode);
    levelRef.current = level;

    // Add new cones
    for (const conePos of level.cones) {
      const cone = buildCone();
      cone.position.set(conePos.x, 0, conePos.z);
      sceneRef.current.add(cone);
      coneMeshesRef.current.push({ mesh: cone, x: conePos.x, z: conePos.z });
    }

    reset();
  // reset is stable (useCallback with empty deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="rounded-2xl border border-gray-200 shadow-md overflow-hidden"
        style={{ width: 800, height: 500, maxWidth: "100%" }}
      />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Hits: <span className="font-bold text-gray-900">{hits}</span>
        </span>
        <div className="flex gap-2">
          {flash && (
            <span className="mr-2 self-center text-xs font-semibold text-red-600">
              Hit!
            </span>
          )}
          {done && (
            <span className="mr-2 self-center text-xs font-semibold text-green-600">
              Completed! ({hits} hits)
            </span>
          )}
          <button
            onClick={reset}
            className="
              rounded-lg
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-4
              py-2
              text-sm
              font-bold
              text-white
              shadow
              transition-transform
              duration-200
              hover:-translate-y-0.5
            "
          >
            {done ? "Play Again" : "Restart"}
          </button>
        </div>
      </div>
    </div>
  );
}
