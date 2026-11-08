/* ------------------------------------------------------------------ */
/*  serviceZones — the road-based service-area polygons, loaded once.  */
/*                                                                    */
/*  Single source of truth for the zone outlines drawn by the         */
/*  homepage map and the booking form's pickup map, so the area a      */
/*  customer can book from is identical in both places. The GeoJSON    */
/*  is generated offline by scripts/generate-zones.mjs.                */
/*                                                                    */
/*  Imported `?raw` + parsed because Vite only treats `.json` as       */
/*  JSON — a bare `.geojson` import would resolve to a URL instead     */
/*  of the object.                                                    */
/* ------------------------------------------------------------------ */
import zonesGeojson from "../data/service-zones.geojson?raw";

/** Zone geometries keyed by the ids the generator writes ("free", "service"). */
export const ZONE_GEOMETRIES = new Map(
  JSON.parse(zonesGeojson).features.map((feature) => [
    feature.properties?.id,
    feature.geometry,
  ])
);

/** Wrap one zone geometry as a single-feature GeoJSON payload for <GeoJSON>.
 *  Returns null when the zone is missing, so a bad data file degrades to
 *  "no outline drawn" rather than throwing inside Leaflet. */
export function zoneFeature(geometry) {
  return geometry ? { type: "Feature", properties: {}, geometry } : null;
}

export const SERVICE_ZONE = zoneFeature(ZONE_GEOMETRIES.get("service"));
export const FREE_ZONE = zoneFeature(ZONE_GEOMETRIES.get("free"));
