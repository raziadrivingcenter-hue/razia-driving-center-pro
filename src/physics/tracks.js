// =============================================================================
// Track definitions — data-driven layouts for L-Track and Parking.
// All dimensions in metres. Car is 1.8m wide × 4m long.
// Coordinate convention: heading 0 faces +Z, heading π/2 faces +X.
//
// The player must REVERSE into both tracks (press S). The car starts facing
// AWAY from the track (heading 0 = +Z), and the track extends behind it (-Z).
//
// Finish boxes are at least 5m × 3m to fit the 4m × 1.8m car with margin.
// Cones are placed at corridor edges where the center-line driving path
// clears them by at least 1.0m (hit radius is 0.6m).
// =============================================================================

export const CAR_DIMENSIONS = {
  length: 4.0,
  width: 1.8,
};

export const WALL = {
  thickness: 0.3,
  height: 0.6,
};

export const CONE = {
  radius: 0.3,
  height: 0.8,
};

/* ── Track A: L-Track ──
   Car starts at entrance facing +Z (away from corridor). Reverses into
   the long leg, drives forward through the corner, stops in the end box.

   Top-down layout (+Z up):

   Short leg                   Long leg
   z=-8  ──────────────────    z=11
   z=-3  ──────────────────    z=7
         │                  │   z=4
         x=3.3              x=10.3  z=1
                               (corridor x ∈ [-3, 3])
   */

function buildLTrack() {
  const start = { x: 0, z: 12, heading: 0 };

  const walls = [
    // Long leg: left wall (x = -3)
    { x: -3, z: 3.5, w: WALL.thickness, d: 16 },
    // Long leg: right wall (x = 3), stops before corner at z = -5
    { x: 3, z: 5.5, w: WALL.thickness, d: 11 },
    // Corner wall connecting long leg to short leg
    { x: 3, z: -6.5, w: WALL.thickness, d: 3 },
    // Short leg: upper wall (z = -8)
    { x: 6.8, z: -8, w: 7, d: WALL.thickness },
    // Short leg: lower wall (z = -3)
    { x: 6.8, z: -3, w: 7, d: WALL.thickness },
  ];

  // Finish box: 5m × 3m, aligned with short leg (car enters heading π/2)
  const finish = { x: 5.5, z: -6.5, w: 5.0, d: 3.0 };

  // Cones at corridor edges — car drives down center, clears them by >1m
  const cones = [];
  // Long leg: cones on left edge only (x=-2.5), car drives at x=0
  for (let z = 8; z >= 0; z -= 3) {
    cones.push({ x: -2.5, z });
  }
  // Short leg: cones near the side walls
  cones.push({ x: 4.0, z: -7.8 });
  cones.push({ x: 4.0, z: -3.2 });
  cones.push({ x: 9.5, z: -7.8 });
  cones.push({ x: 9.5, z: -3.2 });

  return { key: "ltrack", start, walls, cones, finish, groundSize: 38 };
}

/* ── Track B: Parking ──
   Car starts on the road facing away from the bay. Reverses into the
   empty bay beside the road.

   Top-down layout:
   Bay (empty)        │  Road
   z=-4 to z=4        │
   x=-13 to x=-8      │  x=2
   */

function buildParking() {
  const start = { x: 2, z: 12, heading: 0 };

  const bayX = -10.5;
  const bayZ = 0;
  const bayW = 5.0;
  const bayD = 8.0;

  const walls = [
    // Bay back wall (far side, -X)
    { x: bayX - bayW, z: bayZ, w: WALL.thickness, d: bayD + 1 },
    // Bay left wall (-Z side)
    { x: bayX - bayW / 2, z: bayZ - bayD / 2 - 0.5, w: bayW, d: WALL.thickness },
    // Bay right wall (+Z side)
    { x: bayX - bayW / 2, z: bayZ + bayD / 2 + 0.5, w: bayW, d: WALL.thickness },
    // Road boundary walls
    { x: -1.5, z: 6, w: WALL.thickness, d: 14 },
    { x: 5.5, z: 6, w: WALL.thickness, d: 14 },
  ];

  // Static parked cars in adjacent bays
  const parkedCars = [
    { x: bayX - bayW - 3.5, z: bayZ, heading: 0 },
  ];

  // Finish box: 5m × 3m, centered in bay
  const finish = {
    x: bayX - bayW + 0.5,
    z: bayZ - 1.0,
    w: 5.0,
    d: 3.0,
  };

  // Cones at bay corners (car drives down center, clears them)
  const cones = [
    { x: bayX - bayW, z: bayZ - bayD / 2 },
    { x: bayX, z: bayZ - bayD / 2 },
    { x: bayX - bayW, z: bayZ + bayD / 2 },
    { x: bayX, z: bayZ + bayD / 2 },
  ];

  return { key: "parking", start, walls, cones, parkedCars, finish, groundSize: 32 };
}

export const TRACKS = {
  ltrack: buildLTrack(),
  parking: buildParking(),
};

export function getTrack(mode) {
  return TRACKS[mode] || TRACKS.ltrack;
}
