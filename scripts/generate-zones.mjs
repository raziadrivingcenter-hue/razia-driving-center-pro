/* ------------------------------------------------------------------ */
/*  generate-zones.mjs — build the road-based service-area polygons.  */
/*                                                                    */
/*  MANUAL, ONE-OFF. Never runs at page load and never at build time: */
/*  the result is committed so the public site needs no API key and   */
/*  no network access.                                                */
/*                                                                    */
/*  Default provider — OpenRouteService (key required, local only):   */
/*      ORS_API_KEY=... node scripts/generate-zones.mjs               */
/*    .env.local is read automatically when present; it is git-       */
/*    ignored, so the key never reaches the repo or the frontend.     */
/*                                                                    */
/*  Keyless bootstrap — Valhalla's public demo instance:              */
/*      node scripts/generate-zones.mjs --provider=valhalla           */
/*    A different routing engine, so its outlines are not identical   */
/*    to ORS. Use it to get data before a key is available.           */
/*                                                                    */
/*  Regenerate when BASE_LOCATION in src/lib/serviceAreaConfig.js     */
/*  changes, or every few months as Lahore's road network changes.    */
/* ------------------------------------------------------------------ */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_LOCATION,
  SERVICE_RADIUS_METERS,
  FREE_RADIUS_METERS,
} from "../src/lib/serviceAreaConfig.js";
import { pointInPolygon } from "../src/lib/pointInPolygon.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(HERE, "../src/data/service-zones.geojson");

/** Douglas-Peucker tolerance in metres, Valhalla only. 20 m keeps the 20 km
 *  outline at ~2.3k points (~50 KB) instead of ~10k points (~230 KB) — well
 *  below the point where the shape would visibly lose its road-based form. */
const VALHALLA_GENERALIZE_METRES = 20;

/** A ring needs at least 4 positions (a closed triangle). */
const MIN_RING_POSITIONS = 4;

/** Free zone first so the legend order matches the drawing order. */
const RANGES = [
  { id: "free", metres: FREE_RADIUS_METERS },
  { id: "service", metres: SERVICE_RADIUS_METERS },
];

/** Read .env.local if it exists. Node does not do this for us, and the ORS
 *  key belongs there rather than in a package.json script. Real environment
 *  variables always win, so a caller can still override the file. */
function loadLocalEnv() {
  let contents;
  try {
    contents = readFileSync(resolve(HERE, "../.env.local"), "utf8");
  } catch {
    return;
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const PROVIDERS = {
  ors: {
    label: "OpenRouteService",
    profile: "driving-car",
    source: "openrouteservice",

    async fetch(range) {
      const apiKey = process.env.ORS_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ORS_API_KEY is not set. Add it to .env.local (git-ignored) or pass it inline:\n" +
            "  ORS_API_KEY=... node scripts/generate-zones.mjs"
        );
      }

      const baseUrl = (
        process.env.ORS_BASE_URL || "https://api.openrouteservice.org"
      ).replace(/\/+$/, "");

      const response = await fetch(`${baseUrl}/v2/isochrones/driving-car`, {
        method: "POST",
        headers: {
          // OpenRouteService expects the bare key here — no "Bearer" prefix.
          Authorization: apiKey,
          "Content-Type": "application/json",
          // ORS answers 406 unless the response type is asked for by name.
          Accept: "application/geo+json",
        },
        body: JSON.stringify({
          locations: [[BASE_LOCATION.lng, BASE_LOCATION.lat]],
          range_type: "distance",
          range: [range.metres],
          area_units: "m",
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400);
        throw new Error(
          `OpenRouteService isochrones failed (${response.status}): ${detail}`
        );
      }

      const payload = await response.json();
      return { geometry: payload?.features?.[0]?.geometry };
    },
  },

  valhalla: {
    label: "Valhalla (public demo)",
    profile: "auto",
    source: "valhalla-demo",

    async fetch(range) {
      const baseUrl = (
        process.env.VALHALLA_BASE_URL || "https://valhalla1.openstreetmap.de"
      ).replace(/\/+$/, "");

      const response = await fetch(`${baseUrl}/isochrone`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          locations: [{ lat: BASE_LOCATION.lat, lon: BASE_LOCATION.lng }],
          costing: "auto",
          // Valhalla takes `distance` in kilometres.
          contours: [{ distance: range.metres / 1000 }],
          polygons: true,
          generalize: VALHALLA_GENERALIZE_METRES,
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400);
        throw new Error(`Valhalla isochrone failed (${response.status}): ${detail}`);
      }

      const payload = await response.json();
      const wanted = range.metres / 1000;
      const feature = payload?.features?.find(
        (item) => Number(item?.properties?.contour) === wanted
      );

      return { geometry: feature?.geometry };
    },
  },
};

/** Every position on the outer ring of each polygon, flattened. */
function outerRingVertices(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const vertices = [];

  for (const rings of polygons) vertices.push(...rings[0]);
  return vertices;
}

function assertValidGeometry(geometry, range) {
  if (geometry?.type !== "Polygon" && geometry?.type !== "MultiPolygon") {
    throw new Error(
      `The ${range.id} zone (${range.metres} m) came back as ${JSON.stringify(
        geometry?.type
      )} — expected Polygon or MultiPolygon.`
    );
  }

  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  if (!Array.isArray(polygons) || polygons.length === 0) {
    throw new Error(`The ${range.id} zone has no polygons.`);
  }

  for (const rings of polygons) {
    if (!Array.isArray(rings) || rings.length === 0) {
      throw new Error(`The ${range.id} zone has an empty polygon.`);
    }

    for (const ring of rings) {
      if (!Array.isArray(ring) || ring.length < MIN_RING_POSITIONS) {
        throw new Error(
          `The ${range.id} zone has a ring with fewer than ${MIN_RING_POSITIONS} positions.`
        );
      }

      for (const position of ring) {
        if (!Array.isArray(position) || position.length < 2) {
          throw new Error(`The ${range.id} zone has a malformed coordinate.`);
        }
        if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) {
          throw new Error(`The ${range.id} zone has a non-finite coordinate.`);
        }
      }
    }
  }

  // The zone is meaningless if it does not actually contain the office.
  if (!pointInPolygon(BASE_LOCATION, geometry)) {
    throw new Error(`The ${range.id} zone does not contain the base location.`);
  }
}

async function main() {
  loadLocalEnv();

  const requested =
    (process.argv
      .slice(2)
      .find((arg) => arg.startsWith("--provider=")) || ""
    ).split("=")[1] || "ors";

  const provider = PROVIDERS[requested];
  if (!provider) {
    throw new Error(
      `Unknown provider "${requested}". Use one of: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }

  console.log(
    `Generating ${RANGES.length} road-based zone(s) from ${provider.label}…`
  );

  const results = [];
  for (const range of RANGES) {
    const { geometry } = await provider.fetch(range);
    assertValidGeometry(geometry, range);
    results.push({ range, geometry });
    console.log(`  ${range.id}: ${range.metres} m`);
  }

  // The free zone has to sit inside the service zone, or the legend would be
  // describing two unrelated shapes.
  const serviceGeometry = results.find(
    (result) => result.range.id === "service"
  ).geometry;
  const freeGeometry = results.find((result) => result.range.id === "free").geometry;

  for (const [lng, lat] of outerRingVertices(freeGeometry)) {
    if (!pointInPolygon({ lat, lng }, serviceGeometry)) {
      throw new Error("The free zone is not contained by the service zone.");
    }
  }

  const collection = {
    type: "FeatureCollection",
    properties: {
      generatedAt: new Date().toISOString(),
      source: provider.source,
      provider: provider.label,
      profile: provider.profile,
      rangeType: "distance",
      units: "metres",
      baseLocation: { lat: BASE_LOCATION.lat, lng: BASE_LOCATION.lng },
      ranges: RANGES.map((range) => ({ id: range.id, metres: range.metres })),
    },
    features: results.map(({ range, geometry }) => ({
      type: "Feature",
      properties: { id: range.id, rangeM: range.metres },
      geometry,
    })),
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const json = `${JSON.stringify(collection, null, 2)}\n`;
  writeFileSync(OUTPUT_PATH, json, "utf8");

  const kilobytes = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`\nWrote ${OUTPUT_PATH} (${kilobytes} KB)`);
  console.log(
    "Regenerate when the base location changes, or every few months."
  );
}

main().catch((error) => {
  // Deliberately the message only: nothing here should ever echo the key.
  console.error(`\n${error.message}`);
  process.exit(1);
});
