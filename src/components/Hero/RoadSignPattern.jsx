// =============================================================================
// RoadSignPattern — Pakistani road signs in an even grid across the hero.
// White silhouettes, no rotation, embossed into the orange gradient.
// =============================================================================

import { ReactComponent } from "react";

/* ── Sign SVGs — all 100×100 viewBox, white fill ── */

const StopSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <polygon
      points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30"
      fill="white"
    />
  </svg>
);

const GiveWaySign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <polygon
      points="50,15 88,82 12,82"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinejoin="round"
    />
  </svg>
);

const NoEntrySign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
    <rect x="16" y="44" width="68" height="12" rx="2" fill="white" />
  </svg>
);

const SpeedLimitSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
    <text x="50" y="60" textAnchor="middle" fontSize="36" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">60</text>
  </svg>
);

const NoParkingSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
    <line x1="22" y1="22" x2="78" y2="78" stroke="white" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const NoHornSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
    <path d="M30 50 L40 40 L40 60 Z" fill="white" />
    <rect x="42" y="38" width="2" height="24" fill="white" />
    <path d="M58 42 L70 58 M70 42 L58 58" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const SpeedBreakerSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <polygon
      points="50,20 80,80 20,80"
      fill="none"
      stroke="white"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <path d="M28 58 L42 48 L56 58 L70 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const PedestrianCrossingSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <polygon
      points="50,20 80,80 20,80"
      fill="none"
      stroke="white"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="35" r="8" fill="white" />
    <line x1="50" y1="43" x2="50" y2="60" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="38" y1="52" x2="62" y2="52" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="60" x2="40" y2="75" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="60" x2="60" y2="75" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const SchoolAheadSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <polygon
      points="50,20 80,80 20,80"
      fill="none"
      stroke="white"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <rect x="36" y="44" width="28" height="20" fill="white" rx="2" />
    <circle cx="40" cy="68" r="5" fill="white" />
    <circle cx="60" cy="68" r="5" fill="white" />
  </svg>
);

const RoundaboutSign = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
    <path d="M50 30 A20 20 0 1 1 50 70 A20 20 0 1 1 50 30"
      fill="none" stroke="white" strokeWidth="4" />
    <polygon points="50,22 47,30 53,30" fill="white" />
  </svg>
);

const CompulsoryKeepLeft = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="42" fill="white" />
    <path d="M60 30 L40 50 L60 70" stroke="#FF3131" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Sign registry ── */

const SIGN_COMPONENTS = {
  stop: StopSign,
  giveWay: GiveWaySign,
  noEntry: NoEntrySign,
  speedLimit: SpeedLimitSign,
  noParking: NoParkingSign,
  noHorn: NoHornSign,
  speedBreaker: SpeedBreakerSign,
  pedestrianCrossing: PedestrianCrossingSign,
  schoolAhead: SchoolAheadSign,
  roundabout: RoundaboutSign,
  keepLeft: CompulsoryKeepLeft,
};

/* ── Grid: 4 cols × 3 rows = 12 cells. Every 4th is large (68px), rest 42px ── */

const GRID_ORDER = [
  "stop",          //  large (idx 3)
  "giveWay",
  "noEntry",
  "speedLimit",    //  large (idx 7)
  "noParking",
  "noHorn",
  "speedBreaker",  //  large (idx 11)
  "pedestrianCrossing",
  "schoolAhead",
  "roundabout",
  "keepLeft",
  "speedLimit",    //  extra to fill
];

const COLS = 4;
const ROWS = 3;

/* ── Component ── */

export default function RoadSignPattern() {
  const cellW = 100 / COLS;  // % per column
  const cellH = 100 / ROWS;  // % per row

  const signs = GRID_ORDER.map((id, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const isLarge = (idx + 1) % 4 === 0;
    const size = isLarge ? 68 : 42;

    // Center the sign within its cell
    const leftPct = col * cellW + (cellW / 2);
    const topPct = row * cellH + (cellH / 2);

    const SignSvg = SIGN_COMPONENTS[id];

    return (
      <div
        key={idx}
        style={{
          position: "absolute",
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
          opacity: 0.16,
        }}
      >
        <SignSvg width="100%" height="100%" />
      </div>
    );
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {signs}
    </div>
  );
}
