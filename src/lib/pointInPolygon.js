// =============================================================================
// Point-in-polygon for GeoJSON Polygon / MultiPolygon.
//
// The service-area zones are road-based isochrones (see
// scripts/generate-zones.mjs), not circles, so "is this pickup inside the
// area?" needs a real geometry test. That is the only geometric operation the
// map needs, so it is written here rather than pulling in a dependency.
//
// GeoJSON coordinates are [lng, lat].
// =============================================================================

/** Even-odd ray casting against one ring of [lng, lat] positions.
 *  `point` is {lat, lng}. Works for holes too — they are simple polygons. */
function pointInRing(point, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false;

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];

    // A ray east of the point crosses this edge when exactly one endpoint is
    // above it, and the intersection falls to the right. The strict comparison
    // on both endpoints keeps vertices lying exactly on the ray unambiguous.
    const crossesLatitude = latI > point.lat !== latJ > point.lat;

    if (
      crossesLatitude &&
      point.lng < ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/** Inside the outer ring, and outside every hole. */
function pointInPolygonRings(point, rings) {
  if (!Array.isArray(rings) || rings.length === 0) return false;
  if (!pointInRing(point, rings[0])) return false;

  for (let i = 1; i < rings.length; i += 1) {
    if (pointInRing(point, rings[i])) return false;
  }

  return true;
}

/**
 * Is `point` inside a GeoJSON Polygon or MultiPolygon?
 *
 * @param {{lat: number, lng: number}} point
 * @param {{type: "Polygon"|"MultiPolygon", coordinates: any}} geometry
 * @returns {boolean}
 */
export function pointInPolygon(point, geometry) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return false;
  }
  if (!geometry || typeof geometry !== "object") return false;

  if (geometry.type === "Polygon") {
    return pointInPolygonRings(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates;
    return (
      Array.isArray(polygons) &&
      polygons.some((rings) => pointInPolygonRings(point, rings))
    );
  }

  return false;
}
