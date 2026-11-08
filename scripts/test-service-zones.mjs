/* ------------------------------------------------------------------ */
/*  test-service-zones.mjs — verify the road-based zone geometry.      */
/*                                                                    */
/*  Run after regenerating src/data/service-zones.geojson:             */
/*      node scripts/test-service-zones.mjs                           */
/*                                                                    */
/*  Checks the point-in-polygon helper against the real zone data and  */
/*  against synthetic polygons with holes and MultiPolygons, then      */
/*  confirms the service zone really is road-based rather than a       */
/*  circle.                                                            */
/* ------------------------------------------------------------------ */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { pointInPolygon } from "../src/lib/pointInPolygon.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ZONES_PATH = resolve(HERE, "../src/data/service-zones.geojson");

const zones = JSON.parse(fs.readFileSync(ZONES_PATH, "utf8"));
const byId = new Map(zones.features.map((feature) => [feature.properties.id, feature.geometry]));

const free = byId.get("free");
const service = byId.get("service");
const BASE = zones.properties.baseLocation;

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}: ${actual}`);
}

console.log(`source: ${zones.properties.source} | generatedAt: ${zones.properties.generatedAt}`);
console.log("\n--- real zone data ---");
check("base location is inside the free zone", pointInPolygon(BASE, free), true);
check("base location is inside the service zone", pointInPolygon(BASE, service), true);
check(
  "30 km north is outside the service zone",
  pointInPolygon({ lat: BASE.lat + 0.27, lng: BASE.lng }, service),
  false
);
check(
  "30 km east is outside the service zone",
  pointInPolygon({ lat: BASE.lat, lng: BASE.lng + 0.33 }, service),
  false
);
check(
  "1 km north is inside the free zone",
  pointInPolygon({ lat: BASE.lat + 0.009, lng: BASE.lng }, free),
  true
);

console.log("\n--- synthetic geometry ---");
const withHole = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ],
    [
      [3, 3],
      [3, 7],
      [7, 7],
      [7, 3],
      [3, 3],
    ],
  ],
};
check("point inside the hole", pointInPolygon({ lat: 5, lng: 5 }, withHole), false);
check(
  "point between outer ring and hole",
  pointInPolygon({ lat: 1, lng: 1 }, withHole),
  true
);

const multi = {
  type: "MultiPolygon",
  coordinates: [
    [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
    [
      [
        [5, 5],
        [5, 6],
        [6, 6],
        [6, 5],
        [5, 5],
      ],
    ],
  ],
};
check("MultiPolygon: first part", pointInPolygon({ lat: 0.5, lng: 0.5 }, multi), true);
check("MultiPolygon: second part", pointInPolygon({ lat: 5.5, lng: 5.5 }, multi), true);
check("MultiPolygon: outside both", pointInPolygon({ lat: 3, lng: 3 }, multi), false);

console.log("\n--- malformed input ---");
check("null point", pointInPolygon(null, service), false);
check("null geometry", pointInPolygon(BASE, null), false);
check(
  "Point geometry",
  pointInPolygon(BASE, { type: "Point", coordinates: [0, 0] }),
  false
);
check("NaN latitude", pointInPolygon({ lat: Number.NaN, lng: 74 }, service), false);

console.log("\n--- the service zone should be road-based, not circular ---");
// Binary-search the polygon boundary along each bearing. A circle would give
// the same radius in every direction; a real isochrone does not.
const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG = 111.32 * Math.cos((BASE.lat * Math.PI) / 180);

const radii = [];
for (let bearing = 0; bearing < 360; bearing += 15) {
  const rad = (bearing * Math.PI) / 180;
  let low = 0;
  let high = 40;

  for (let step = 0; step < 40; step += 1) {
    const mid = (low + high) / 2;
    const inside = pointInPolygon(
      {
        lat: BASE.lat + (mid / KM_PER_DEG_LAT) * Math.sin(rad),
        lng: BASE.lng + (mid / KM_PER_DEG_LNG) * Math.cos(rad),
      },
      service
    );
    if (inside) low = mid;
    else high = mid;
  }
  radii.push(low);
}

const min = Math.min(...radii);
const max = Math.max(...radii);
console.log(`  boundary radius ${min.toFixed(1)} km to ${max.toFixed(1)} km`);
if (max / min < 1.05) {
  failures += 1;
  console.log(" FAIL looks like a circle (max/min < 1.05)");
} else {
  console.log("  ok   irregular — confirms a road-based outline");
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
