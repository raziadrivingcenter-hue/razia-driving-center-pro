// =============================================================================
// GameCanvas — wraps the 3D scene in a Canvas with UI overlay.
// =============================================================================

import { useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import GameScene from "./GameScene";

export default function GameCanvas({ mode }) {
  const [hits, setHits] = useState(0);
  const [status, setStatus] = useState("playing");
  const carRef = useRef(null);

  const handleState = useCallback((state) => {
    setHits(state.hits);
    if (state.status !== "playing") {
      setStatus(state.status);
    }
  }, []);

  const handleRestart = useCallback(() => {
    setHits(0);
    setStatus("playing");
    if (carRef.current) {
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, []);

  const frozen = status === "completed" || status === "parked-dirty";

  return (
    <div className="relative">
      <div
        className="rounded-2xl border border-gray-200 shadow-md overflow-hidden mx-auto"
        style={{ width: 800, height: 500, maxWidth: "100%" }}
      >
        <Canvas
          shadows
          camera={{ position: [0, 8, -12], fov: 55 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#87ceeb"]} />
          <fog attach="fog" args={["#87ceeb", 30, 70]} />
          <GameScene
            mode={mode}
            onState={handleState}
            carRef={carRef}
          />
        </Canvas>

        {frozen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="rounded-xl bg-white px-6 py-4 text-center shadow-lg">
              {status === "completed" ? (
                <>
                  <p className="text-2xl font-extrabold text-green-600">Completed!</p>
                  <p className="mt-1 text-sm text-gray-600">Clean run — no touches.</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-extrabold text-amber-600">
                    Parked, but you touched the boundary.
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Hits: {hits}. Press Play Again to retry.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Hits: <span className="font-bold text-gray-900">{hits}</span>
        </span>
        <button
          onClick={handleRestart}
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
          {frozen ? "Play Again" : "Restart"}
        </button>
      </div>
    </div>
  );
}
