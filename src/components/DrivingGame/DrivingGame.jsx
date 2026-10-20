// =============================================================================
// DrivingGame — top-down L-Track and parking practice.
// Desktop only. Not an official test.
// =============================================================================

import { useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";
import { useMeta } from "../../useMeta";

// Structured data for the practice tool — helps AI engines and search crawlers
// understand this is an interactive practice resource from Razia Driving Center.
const gameStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Driving Test Practice — L-Track & Parking",
  "description":
    "Free top-down driving practice game for L-track reversing and parking bay skills from Razia Driving Center, Lahore.",
  "url": "https://raziadrivingcenter.com/driving-test-practice/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Razia Driving Center",
    "url": "https://raziadrivingcenter.com",
  },
};

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

  // Title + meta + canonical + OG + Twitter (sets crawler-readable tags before/after mount)
  useMeta({
    title: "Driving Test Practice | L-Track and Parking | Razia Driving Center",
    description:
      "Practice the L-track reverse and parking bay with a free top-down driving game from Razia Driving Center, Lahore. Desktop keyboard practice.",
    canonical: "https://raziadrivingcenter.com/driving-test-practice/",
  });

  // Inject JSON-LD structured data for the practice tool
  useEffect(() => {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(gameStructuredData);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
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
            <GameCanvas key={mode} mode={mode} />
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
