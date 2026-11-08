/* ------------------------------------------------------------------ */
/*  ServiceAreaMap — interactive Leaflet map.                          */
/*                                                                    */
/*  The customer sets a pickup point by tapping the map, dragging the  */
/*  pin, or searching an address. The driving route comes from OSRM    */
/*  (src/lib/routingService.js) and its distance feeds the existing    */
/*  pickDropCalculator engine — no pricing logic is duplicated here.   */
/*                                                                    */
/*  If routing fails we show a straight-line estimate, clearly labelled,*/
/*  and we deliberately do NOT price it.                              */
/*                                                                    */
/*  The free and service zones are road-based polygons held in         */
/*  src/data/service-zones.geojson and regenerated offline by         */
/*  scripts/generate-zones.mjs — not circles, so the drawn shape       */
/*  matches how the distance is actually driven.                      */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  GeoJSON,
  ZoomControl,
  AttributionControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  MapPin,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useRouter } from "../../router";
import {
  BASE_LOCATION,
  SERVICE_RADIUS_KM,
  FREE_RADIUS_KM,
  LAHORE_MAX_BOUNDS,
  SERVICE_AREA_FIT_BOUNDS,
  DEFAULT_ZOOM,
  MAX_ROUTE_ZOOM,
  ROUTE_FIT_PADDING_PX,
  ROUTE_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
  MAP_THEME,
} from "../../lib/serviceAreaConfig";
import { getDrivingRoute, haversineKm, RoutingError } from "../../lib/routingService";
import { searchAddresses } from "../../lib/geocodingService";
import VectorBaseLayer from "./VectorBaseLayer";
import {
  calculatePickDropCharges,
  getCourseDurationDays,
  getPlanType,
  PICK_DROP_COURSE_CONFIG,
} from "../../lib/pickDropCalculator";
import { pointInPolygon } from "../../lib/pointInPolygon";
import { SERVICE_ZONE, FREE_ZONE, ZONE_GEOMETRIES } from "../../lib/serviceZones";
import { mapThemeVars, baseIcon, pickupIcon, detectWebGL } from "../../lib/mapShared";

// Confirmed service areas across Lahore (pick-up within 20 km of the office).
// Text-only list — no per-area coordinates are asserted.
const AREAS = [
  "Gulberg 1", "Gulberg 2", "Gulberg 3", "Falcon Complex", "Makka Colony",
  "Calvary Ground", "Gulbahar Colony", "Madina Colony", "Walton", "Askari 5",
  "Shah Jamal", "Ghalib Road", "Canal Park", "Fazlia Colony", "Shadman 1",
  "Upper Mall Scheme", "Mian Mir Colony", "CMA Colony", "Super Town",
  "New Super Town", "Model Town", "Muslim Town", "Faisal Town",
  "Rehmanpura Colony", "Ichhra", "Shershah Colony", "DHA Phase 1",
  "DHA Phase 2", "DHA Phase 3", "DHA Phase 4", "Nishat Colony",
  "Shami Road Cantt", "Tufail Road Cantt", "R.A. Bazar Cantt", "Saddar Town Cantt",
];

const COURSE_OPTIONS = Object.keys(PICK_DROP_COURSE_CONFIG);
const DEFAULT_COURSE = "Economy Driving Course"; // the PLUS plan (2 km free)

const BASE_POINT = [BASE_LOCATION.lat, BASE_LOCATION.lng];

const formatKm = (value) => Number(value).toFixed(1);
const formatMinutes = (value) => `${Math.round(value)} min`;

/** Tap anywhere on the map to drop / move the pin. */
function MapClickHandler({ onPick }) {
  useMapEvents({
    click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}

/** Opening viewport — wide enough to show the whole service radius. */
function FitServiceArea() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(SERVICE_AREA_FIT_BOUNDS, { maxZoom: MAX_ROUTE_ZOOM });
  }, [map]);
  return null;
}

/** Re-frame the map once a route has been loaded. Only depends on `route`,
 *  not on the pin, so dragging does not yank the viewport around. */
function FitRoute({ route }) {
  const map = useMap();
  useEffect(() => {
    const coords = route?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;

    // OSRM GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
    map.fitBounds(
      coords.map(([lng, lat]) => [lat, lng]),
      { padding: [ROUTE_FIT_PADDING_PX, ROUTE_FIT_PADDING_PX], maxZoom: MAX_ROUTE_ZOOM }
    );
  }, [map, route]);
  return null;
}

export default function ServiceAreaMap() {
  const { navigate } = useRouter();

  const [pickup, setPickup] = useState(null);
  const [route, setRoute] = useState(null);
  const [estimateKm, setEstimateKm] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle"); // idle | loading | ready | error
  const [routeError, setRouteError] = useState("");
  const [routeNonce, setRouteNonce] = useState(0); // bumped to retry a failed route
  const [courseId, setCourseId] = useState(DEFAULT_COURSE);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | done | error
  const [searchError, setSearchError] = useState("");

  const searchRef = useRef(null);
  const searchControllerRef = useRef(null);

  // A search still in flight when the component unmounts must not resolve into
  // a setState on a dead component.
  useEffect(() => () => searchControllerRef.current?.abort(), []);

  const handlePickupChange = useCallback((point) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    searchControllerRef.current?.abort();
    setPickup({ lat: point.lat, lng: point.lng });
    setRoute(null);
    setEstimateKm(null);
    setRouteStatus("loading");
    setRouteError("");
    setResults([]);
    setSearchStatus("idle");
    setSearchError("");
  }, []);

  const handleClearPickup = useCallback(() => {
    setPickup(null);
    setRoute(null);
    setEstimateKm(null);
    setRouteStatus("idle");
    setRouteError("");
  }, []);

  const handleSelectResult = useCallback(
    (result) => {
      handlePickupChange(result);
      searchRef.current?.focus();
    },
    [handlePickupChange]
  );

  const handleClearSearch = useCallback(() => {
    searchControllerRef.current?.abort();
    setSearchQuery("");
    setResults([]);
    setSearchStatus("idle");
    setSearchError("");
  }, []);

  // --- Address search — explicit submit only ---------------------------------
  // No search-as-you-type: Nominatim's public instance allows 1 request per
  // second, so searches fire on Enter or the search button and are rate
  // limited (and cached) inside geocodingService.
  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const query = searchQuery.trim();

      if (query.length < SEARCH_MIN_CHARS) {
        setResults([]);
        setSearchStatus("idle");
        setSearchError(`Type at least ${SEARCH_MIN_CHARS} characters to search.`);
        return;
      }

      searchControllerRef.current?.abort();
      const controller = new AbortController();
      searchControllerRef.current = controller;

      setSearchStatus("loading");
      setSearchError("");

      searchAddresses(query, { signal: controller.signal })
        .then((found) => {
          setResults(found);
          setSearchStatus("done");
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setResults([]);
          setSearchStatus("error");
          setSearchError(
            error?.message || "Address search is unavailable right now."
          );
        });
    },
    [searchQuery]
  );

  // --- Driving route, debounced + cancellable -------------------------------
  // `handlePickupChange` owns the reset; this effect only fetches. All setState
  // calls live inside the async callback so the effect body stays side-effect
  // free (React's set-state-in-effect lint rule).
  useEffect(() => {
    if (!pickup) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const result = await getDrivingRoute(BASE_LOCATION, pickup, {
          signal: controller.signal,
        });
        setRoute(result);
        setEstimateKm(null);
        setRouteStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") return;
        // Fall back to a clearly-labelled straight-line estimate. It is never
        // fed into the pricing engine — `pricing` below stays null.
        setRoute(null);
        setEstimateKm(haversineKm(BASE_LOCATION, pickup));
        setRouteStatus("error");
        setRouteError(
          error instanceof RoutingError
            ? error.message
            : "Unexpected routing error — showing a straight-line estimate instead."
        );
      }
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup, routeNonce]);

  // --- Derived state -------------------------------------------------------
  // OSRM snaps the requested point onto the nearest road. Drawing the pin at
  // the snapped end of the route keeps the pin, the service-area check and the
  // distance honest. `pickup` stays the customer's raw choice — re-routing
  // from the snapped point would feed the route back into itself.
  const snappedPickup = useMemo(() => {
    const coords = route?.geometry?.coordinates;
    const last = Array.isArray(coords) ? coords[coords.length - 1] : null;
    if (!Array.isArray(last) || last.length < 2) return pickup;

    const [lng, lat] = last;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return pickup;

    return { lat, lng };
  }, [route, pickup]);

  const webglAvailable = useMemo(() => detectWebGL(), []);

  const servicePoint = snappedPickup ?? pickup;
  const straightLineKm = servicePoint
    ? haversineKm(BASE_LOCATION, servicePoint)
    : null;

  // The zones are road-based polygons, so "inside the area?" is a geometry
  // test, not a radius comparison. Both conditions must hold: the point has to
  // be inside the 20 KM polygon AND the route has to come back at or under
  // 20 KM. While the route is still loading — or has failed — `routeWithin` is
  // null and the polygon alone decides, so the panel does not flash "outside"
  // during a slow request.
  const zoneContains =
    servicePoint != null &&
    pointInPolygon(servicePoint, ZONE_GEOMETRIES.get("service"));
  const routeWithin = route ? route.distanceKm <= SERVICE_RADIUS_KM : null;
  const withinServiceArea = zoneContains && routeWithin !== false;

  // Inside the polygon but over the limit on the road — the case the old
  // circles could not express, and the one a customer is most likely to
  // dispute, so it gets its own explanation.
  const routeTooLong = zoneContains && routeWithin === false;

  const durationDays = getCourseDurationDays(courseId);
  const planType = getPlanType(courseId);

  // Only price a real driving route — never the straight-line estimate.
  const pricing = useMemo(
    () =>
      route
        ? calculatePickDropCharges(route.distanceKm, durationDays, planType)
        : null,
    [route, durationDays, planType]
  );

  const routeKey = route
    ? `${route.geometry.coordinates.length}-${route.distanceKm.toFixed(2)}`
    : null;

  const canBook = Boolean(pickup && withinServiceArea);

  return (
    <section id="service-area" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-orange-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6201]">
            Service Area
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl">
            Where We Pick &amp; Drop
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Free pick-up &amp; drop within {FREE_RADIUS_KM} KM driving distance on
            the{" "}
            <span className="font-semibold text-gray-700">PLUS Plan</span>. Available
            up to {SERVICE_RADIUS_KM} KM across Lahore.
          </p>
        </div>

        {/* Controls */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Pickup address search"
          >
            <label
              htmlFor="pickup-address"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Search your address
            </label>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchRef}
                id="pickup-address"
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchQuery(value);
                  if (value.trim().length < SEARCH_MIN_CHARS) {
                    setResults([]);
                    setSearchStatus("idle");
                    setSearchError("");
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setResults([]);
                    setSearchStatus("idle");
                  }
                }}
                placeholder="e.g. DHA Phase 5, Lahore"
                autoComplete="off"
                aria-label="Search your pickup address"
                aria-describedby="pickup-address-status"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-16 text-sm text-gray-800 outline-none transition focus:border-[#FF6201] focus:ring-2 focus:ring-[#FF6201]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear address search"
                  className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Search addresses"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#FF6201] transition hover:bg-orange-50"
              >
                <Search size={14} />
              </button>

              {searchStatus === "done" && results.length > 0 && (
                <ul
                  aria-label="Address suggestions"
                  className="absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {results.map((result, index) => (
                    <li key={`${result.lat}-${result.lng}-${index}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                      >
                        <MapPin size={13} className="mt-0.5 shrink-0 text-[#FF6201]" />
                        <span className="line-clamp-2">{result.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {searchStatus === "loading" && (
              <span className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 size={12} className="animate-spin" /> Searching addresses…
              </span>
            )}

            {searchStatus === "done" && results.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-500">
                No addresses found for &ldquo;{searchQuery.trim()}&rdquo;.
              </p>
            )}

            {searchStatus === "error" && (
              <p className="mt-1.5 text-xs font-medium text-red-500">{searchError}</p>
            )}
          </form>

          <div>
            <label
              htmlFor="pickup-course"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Course
            </label>
            <select
              id="pickup-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              aria-label="Choose a course to calculate the pick and drop charge"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#FF6201] focus:ring-2 focus:ring-[#FF6201]/20"
            >
              {COURSE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: MAP_THEME.freeZoneColor }}
            />
            {FREE_RADIUS_KM} KM free driving distance (PLUS Plan)
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: MAP_THEME.serviceZoneColor }}
            />
            {FREE_RADIUS_KM}–{SERVICE_RADIUS_KM} KM charged
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: MAP_THEME.basePinColor }}
            />
            Our Center
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: MAP_THEME.pickupPinColor }}
            />
            Your pickup
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="h-1 w-4 rounded-full"
              style={{ backgroundColor: MAP_THEME.routeColor }}
            />
            Driving route
          </span>
        </div>

        {/* Map + breakdown */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div
            className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100"
            role="region"
            aria-label="Interactive map of our Lahore service area"
          >
            {!webglAvailable ? (
              <div className="flex h-[420px] flex-col items-center justify-center gap-2 bg-gray-50 p-8 text-center md:h-[520px]">
                <AlertTriangle size={22} className="text-amber-500" />
                <p className="text-sm font-medium text-gray-700">
                  The interactive map needs WebGL, which this browser or device
                  has turned off.
                </p>
                <p className="max-w-sm text-xs leading-relaxed text-gray-500">
                  You can still book — use the directions link on this page, or
                  pick a slot and we will confirm your pick &amp; drop distance.
                </p>
              </div>
            ) : (
              <MapContainer
                center={BASE_POINT}
                zoom={DEFAULT_ZOOM}
                maxBounds={LAHORE_MAX_BOUNDS}
                maxBoundsViscosity={0.8}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                style={{ width: "100%", ...mapThemeVars }}
                className="service-area-map h-[420px] md:h-[520px]"
              >
                <VectorBaseLayer />
                <ZoomControl position="bottomright" />
                <AttributionControl position="bottomleft" />

                <MapClickHandler onPick={handlePickupChange} />
                <FitServiceArea />
                <FitRoute route={route} />

                {/* Service area — road-based isochrone, soft orange fill.
                    `interactive: false` lets clicks fall through to the map, so
                    tapping the fill still drops the pin. */}
                {SERVICE_ZONE && (
                  <GeoJSON
                    data={SERVICE_ZONE}
                    interactive={false}
                    style={{
                      color: MAP_THEME.serviceZoneColor,
                      fillColor: MAP_THEME.serviceZoneColor,
                      fillOpacity: MAP_THEME.serviceZoneFillOpacity,
                      weight: MAP_THEME.serviceZoneWeight,
                      dashArray: MAP_THEME.serviceZoneDashArray,
                    }}
                  />
                )}

                {/* Free pick-up zone (PLUS Plan), drawn on top of the service
                    zone. Green, matching the legend and the "Free with PLUS"
                    line in the breakdown. */}
                {FREE_ZONE && (
                  <GeoJSON
                    data={FREE_ZONE}
                    interactive={false}
                    style={{
                      color: MAP_THEME.freeZoneColor,
                      fillColor: MAP_THEME.freeZoneColor,
                      fillOpacity: MAP_THEME.freeZoneFillOpacity,
                      weight: MAP_THEME.freeZoneWeight,
                    }}
                  />
                )}

              {/* Center marker */}
              <Marker position={BASE_POINT} icon={baseIcon}>
                <Popup>
                  <strong>Razia Driving Center</strong>
                  <br />
                  28/A, S Block, Gulberg 2, Lahore
                </Popup>
              </Marker>

              {/* Pickup pin — draggable, keyboard-movable. Drawn at the
                  road-snapped end of the route, not the raw drop point. */}
              {pickup && servicePoint && (
                <Marker
                  position={[servicePoint.lat, servicePoint.lng]}
                  icon={pickupIcon}
                  draggable
                  keyboard
                  riseOnHover
                  eventHandlers={{
                    dragend: (event) => {
                      const latlng = event.target.getLatLng();
                      handlePickupChange({ lat: latlng.lat, lng: latlng.lng });
                    },
                  }}
                >
                  <Popup>
                    <strong>Your pickup point</strong>
                    <br />
                    {formatKm(straightLineKm ?? 0)} km straight line from our center
                  </Popup>
                </Marker>
              )}

              {/* Driving route — OSRM GeoJSON is [lng, lat], which <GeoJSON> expects */}
              {route && (
                <GeoJSON
                  key={routeKey}
                  data={route.geometry}
                  style={{
                    color: MAP_THEME.routeColor,
                    weight: MAP_THEME.routeWeight,
                    opacity: MAP_THEME.routeOpacity,
                  }}
                />
              )}
              </MapContainer>
            )}
          </div>

          {/* Breakdown */}
          <aside
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-5"
            aria-label="Pickup distance and charge estimate"
          >
            <div aria-live="polite" id="pickup-address-status" className="sr-only">
              {searchStatus === "done" &&
                (results.length > 0
                  ? `${results.length} address suggestions available`
                  : "No addresses found")}
            </div>

            {!pickup && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <MapPin size={22} className="text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  Tap the map, drag the pin, or search your address to see your
                  distance and pick &amp; drop charges.
                </p>
              </div>
            )}

            {pickup && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Your pickup point
                  </span>
                  <div className="flex items-center gap-1.5">
                    {withinServiceArea ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-600">
                        <CheckCircle2 size={11} /> In service area
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                        <AlertTriangle size={11} /> Outside service area
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleClearPickup}
                      aria-label="Clear pickup point"
                      className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {routeStatus === "loading" && (
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" /> Calculating driving
                    route…
                  </p>
                )}

                {routeStatus === "ready" && route && (
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="font-dm-sans text-3xl font-bold text-gray-900">
                        {formatKm(route.distanceKm)}
                        <span className="ml-1 text-base font-semibold text-gray-400">km</span>
                      </p>
                      <p className="text-xs text-gray-500">driving distance</p>
                    </div>
                    <div className="pb-0.5">
                      <p className="font-dm-sans text-sm font-semibold text-gray-700">
                        ≈ {formatMinutes(route.durationMinutes)}
                      </p>
                      <p className="text-xs text-gray-500">estimated drive time</p>
                    </div>
                  </div>
                )}

                {routeStatus === "error" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="flex items-start gap-2 text-xs font-medium text-amber-800">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <span>{routeError}</span>
                    </p>
                    {estimateKm != null && (
                      <p className="mt-1.5 text-xs text-amber-700">
                        Straight-line estimate:{" "}
                        <span className="font-dm-sans font-bold">
                          {formatKm(estimateKm)} km
                        </span>{" "}
                        — shown for reference only, not used for pricing.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setRouteStatus("loading");
                        setRouteError("");
                        setRouteNonce((nonce) => nonce + 1);
                      }}
                      className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <RefreshCw size={11} /> Try again
                    </button>
                  </div>
                )}

                {!zoneContains && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    This pickup point is outside our {SERVICE_RADIUS_KM} KM service
                    area, so pick &amp; drop is not available here.
                  </p>
                )}

                {routeTooLong && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    This pickup is inside the area on the map, but the driving
                    route is over {SERVICE_RADIUS_KM} KM, so pick &amp; drop is not
                    available here.
                  </p>
                )}

                {pricing && withinServiceArea && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Pick &amp; drop estimate
                    </p>
                    <p className="mt-2 font-dm-sans text-2xl font-bold text-gray-900">
                      Rs. {pricing.pickDropCharges.toLocaleString()}
                    </p>
                    <dl className="mt-3 space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between gap-3">
                        <dt>Distance</dt>
                        <dd className="font-dm-sans font-semibold text-gray-800">
                          {formatKm(pricing.distanceKm)} km
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Rate</dt>
                        <dd className="font-dm-sans font-semibold text-gray-800">
                          Rs. {pricing.ratePerKm}/km
                        </dd>
                      </div>
                      {pricing.freeKm > 0 && (
                        <div className="flex justify-between gap-3">
                          <dt>Free with PLUS</dt>
                          <dd className="font-dm-sans font-semibold text-green-600">
                            {formatKm(pricing.freeKm)} km
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt>Course</dt>
                        <dd className="font-dm-sans font-semibold text-gray-800">
                          {durationDays} days
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Round trips</dt>
                        <dd className="font-dm-sans font-semibold text-gray-800">
                          × {pricing.roundTripMultiplier}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 border-t border-gray-100 pt-2.5 text-[11px] leading-relaxed text-gray-400">
                      {pricing.freeKm > 0 ? (
                        <>
                          ({formatKm(pricing.distanceKm)} −{" "}
                          {formatKm(pricing.freeKm)} free) km
                        </>
                      ) : (
                        <>{formatKm(pricing.distanceKm)} km</>
                      )}{" "}
                      × Rs. {pricing.ratePerKm} × {pricing.durationDays} days ×{" "}
                      {pricing.roundTripMultiplier} = Rs.{" "}
                      {pricing.pickDropCharges.toLocaleString()}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-gray-400">
                      Estimate only — the final price is confirmed when your booking
                      is accepted.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canBook}
                  onClick={() => navigate("/slot-availability/")}
                  aria-label="Continue to booking with this pickup point"
                  className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6201] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e65600] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {canBook
                    ? "Continue to booking"
                    : pickup
                      ? `Outside our ${SERVICE_RADIUS_KM} KM service area`
                      : "Select a pickup point to continue"}
                </button>
              </>
            )}
          </aside>
        </div>

        {/* Confirmed service areas — text list, no per-area coordinates asserted */}
        <div className="mt-6 flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-100"
            >
              <MapPin size={11} className="text-[#FF6201]" />
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
