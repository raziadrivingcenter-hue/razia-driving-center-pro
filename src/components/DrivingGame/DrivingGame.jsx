// =============================================================================
// DrivingGame — top-down L-Track and parking practice.
// Desktop only. Not an official test.
// =============================================================================

import { useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";

const MODES = [
  {
    key: "ltrack",
    label: "L-Track",
    instruction: "Reverse into the L. Do not touch the lines.",
  },
  {
    key: "parking",
    label: "Parking",
    instruction: "Park inside the bay. Do not touch the lines.",
  },
];

function DrivingGame() {
  const [mode, setMode] = useState("ltrack");
  const [tooSmall, setTooSmall] = useState(false);

  // Title + meta
  useEffect(() => {
    document.title = "Driving Test Practice | L-Track and Parking";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Practice the L-track and parking bay with a simple top-down driving game from Razia Driving Center, Lahore."
    );
  }, []);

  // Detect narrow screens
  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < 800);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a
            href="/"
            className="text-sm font-bold text-gray-900 hover:text-[#FF6201]"
          >
            ← Razia Driving Center
          </a>
          <span className="text-xs text-gray-400">
            Practice game — not an official test
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Driving Test Practice
        </h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Practise the L-track reverse and parking bay on your keyboard. This
          is a simple practice game from Razia Driving Center, Lahore — it is
          not the official Punjab driving test.
        </p>

        {/* Mode selector */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`
                rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-200
                ${
                  mode === m.key
                    ? "bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              {m.label}
            </button>
          ))}
          <p className="text-sm text-gray-500">
            {MODES.find((m) => m.key === mode)?.instruction}
          </p>
        </div>

        {/* Canvas area */}
        <div className="mt-4 flex justify-center">
          {tooSmall ? (
            <div className="flex h-[400px] w-full max-w-[800px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              This practice game works best on a computer with a keyboard.
            </div>
          ) : (
            <GameCanvas mode={mode} />
          )}
        </div>

        {/* Controls hint */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
          <span>
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              W
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              ↑
            </kbd>{" "}
            Accelerate
          </span>
          <span>
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              S
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              ↓
            </kbd>{" "}
            Reverse
          </span>
          <span>
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              A
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              ←
            </kbd>{" "}
            Steer left
          </span>
          <span>
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              D
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-600">
              →
            </kbd>{" "}
            Steer right
          </span>
        </div>
      </div>
    </div>
  );
}

export default DrivingGame;
