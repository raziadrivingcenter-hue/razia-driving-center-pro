// =============================================================================
// Service-area + routing configuration — single source of truth for the
// interactive ServiceAreaMap (base point, service radius, route provider,
// geocoding, timings).
//
// Nothing here is JSX and nothing here touches the DOM, so it is safe to
// import from both the browser bundle and a Cloudflare Pages Function.
// =============================================================================

/** Razia Driving Center — 28/A, S Block, Gulberg 2, Lahore.
 *  Same coordinates used by the "Get Directions" link in MapSection.jsx. */
export const BASE_LOCATION = { lat: 31.5201889, lng: 74.3575145 };

/** Pick & Drop is serviceable up to this radius from BASE_LOCATION.
 *  MUST match MAX_DISTANCE_KM in src/lib/pickDropCalculator.js and
 *  functions/lib/slotConfig.js — the map, the quote and the booking
 *  enforcement have to agree. */
export const SERVICE_RADIUS_KM = 20;

/** The PLUS plan gets pick-up free inside this radius.
 *  MUST match PLUS_FREE_KM in src/lib/pickDropCalculator.js. */
export const FREE_RADIUS_KM = 2;

export const SERVICE_RADIUS_METERS = SERVICE_RADIUS_KM * 1000;
export const FREE_RADIUS_METERS = FREE_RADIUS_KM * 1000;

/** Brand accent — route line, focus rings, primary actions. */
export const BRAND_COLOR = "#FF6201";

/** Keep the map inside Greater Lahore. */
export const LAHORE_MAX_BOUNDS = [
  [31.19, 74.0],
  [31.82, 74.66],
];

/** Initial viewport — wide enough to show the whole 20 KM service radius. */
export const SERVICE_AREA_FIT_BOUNDS = [
  [BASE_LOCATION.lat - 0.18, BASE_LOCATION.lng - 0.21],
  [BASE_LOCATION.lat + 0.18, BASE_LOCATION.lng + 0.21],
];

export const DEFAULT_ZOOM = 12;
export const MAX_ROUTE_ZOOM = 15;
export const ROUTE_FIT_PADDING_PX = 40;

/** Routing provider (OSRM). Set VITE_OSRM_BASE_URL to self-host or to
 *  OpenRouteService/GraphHopper later — only routingService.js changes. */
export const ROUTE_BASE_URL =
  import.meta.env?.VITE_OSRM_BASE_URL || "https://router.project-osrm.org";

/** Optional routing API key. The OSRM demo instance needs none; providers
 *  that do (OpenRouteService) read it as an Authorization header. */
export const ROUTE_API_KEY = import.meta.env?.VITE_ROUTE_API_KEY || "";

/** A routing request that has not answered in this long is treated as slow
 *  rather than leaving the customer's map stuck on "calculating". */
export const ROUTE_TIMEOUT_MS = 8000;

/** Address search is proxied through our own Pages Function so we can send
 *  the descriptive User-Agent / Referer Nominatim's usage policy requires
 *  (browsers forbid setting those headers from JavaScript). */
export const GEOCODE_ENDPOINT = "/api/v1/geocode";

/** Minimum characters before an address search fires. */
export const SEARCH_MIN_CHARS = 3;

/** Route requests are debounced by ~400 ms so dragging the pin does not
 *  fire a request per pixel. */
export const ROUTE_DEBOUNCE_MS = 400;

/** The booking form's pickup map waits this long after the last map touch
 *  before routing — a longer debounce than the homepage because the whole
 *  map is dragged (not a pin), so a route per pixel would be wasteful. */
export const BOOKING_ROUTE_DEBOUNCE_MS = 1500;

/** Nominatim's usage policy is 1 request/second — the client enforces it
 *  globally, across every search in the session, not just per keystroke. */
export const GEOCODE_MIN_INTERVAL_MS = 1000;

/** Route + geocode cache sizing, and coordinate rounding (~1 m) for keys. */
export const ROUTE_CACHE_LIMIT = 200;
export const GEOCODE_CACHE_LIMIT = 100;
export const COORD_ROUND_DECIMALS = 5;

/** Vector basemap style (OpenFreeMap tiles rendered by MapLibre). The JSON
 *  lives in /public so it can be re-skinned without touching JSX; point it at
 *  any MapLibre style with VITE_MAP_STYLE_URL. */
export const MAP_STYLE_URL =
  import.meta.env?.VITE_MAP_STYLE_URL || "/map-style.json";

/** Credit shown on the map. Must match the tile provider's terms — the
 *  OpenFreeMap TileJSON is the source of truth. Declared here because
 *  MapLibre's vector sources do not carry attribution at runtime, so the
 *  basemap cannot be shipped without explicitly passing it through. */
export const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Map chrome colours. Kept here rather than in the stylesheet so the route
 *  and zone colours the JS draws cannot drift from the controls; the values
 *  are handed to CSS as custom properties on the map element. */
export const MAP_THEME = {
  controlBackground: "#1f2937",
  controlBackgroundHover: "#374151",
  controlColor: "#ffffff",
  controlBorder: "rgba(255, 255, 255, 0.16)",
  attributionBackground: "rgba(255, 255, 255, 0.9)",
  attributionColor: "#4b5563",
  attributionLinkColor: BRAND_COLOR,
  popupBackground: "#ffffff",
  popupColor: "#1f2937",
  routeColor: BRAND_COLOR,
  routeWeight: 5,
  routeOpacity: 0.85,
  serviceZoneColor: BRAND_COLOR,
  serviceZoneWeight: 2,
  serviceZoneDashArray: "6 4",
  serviceZoneFillOpacity: 0.05,
  freeZoneColor: "#16a34a",
  freeZoneWeight: 2,
  freeZoneFillOpacity: 0.12,
  basePinColor: "#1f2937",
  pickupPinColor: BRAND_COLOR,
};
