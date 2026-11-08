/* ------------------------------------------------------------------ */
/*  PickupMapPanel — centered-crosshair map for the booking form.     */
/*                                                                    */
/*  The customer drags the map until their pickup point sits under    */
/*  the fixed crosshair. 1.5 s after the last interaction, the route  */
/*  is fetched from the existing routing service and its distance is   */
/*  reported to the booking form, which prices it with the existing   */
/*  pickDropCalculator engine — no pricing logic is duplicated here.   */
/*                                                                    */
/*  The service-area check uses the same road-based zones as the      */
/*  homepage map, so the booking form cannot accept a pickup the      */
/*  homepage would reject. If routing fails we report the error and   */
/*  the form falls back to a manual distance entry.                   */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  ZoomControl,
  AttributionControl,
  useMap,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  BASE_LOCATION,
  SERVICE_RADIUS_KM,
  LAHORE_MAX_BOUNDS,
  DEFAULT_ZOOM,
  MAP_THEME,
  BOOKING_ROUTE_DEBOUNCE_MS,
} from "../../lib/serviceAreaConfig";
import { getDrivingRoute, RoutingError } from "../../lib/routingService";
import { pointInPolygon } from "../../lib/pointInPolygon";
import { SERVICE_ZONE, FREE_ZONE, ZONE_GEOMETRIES } from "../../lib/serviceZones";
import { baseIcon, detectWebGL, mapThemeVars } from "../../lib/mapShared";
import VectorBaseLayer from "../ServiceAreaMap/VectorBaseLayer";

const BASE_POINT = [BASE_LOCATION.lat, BASE_LOCATION.lng];

const formatKm = (value) => Number(value).toFixed(1);

/** Keeps the crosshair locked on the pickup point while the map is used.
 *
 *  A same-zoom move is a pan — the user is choosing a pickup point, so the
 *  centre is published (debounced) to the parent. A zoom is only a view
 *  change: the centre is snapped back onto the pickup so the crosshair never
 *  drifts, and the pickup itself is left untouched.
 *
 *  Once a route has loaded, the map zooms out around the pickup after a
 *  second so the whole route is visible; zooming back in then restores the
 *  zoom the user had while dragging. */
function MapController({ pickup, route, routeStatus, onPickupChange }) {
  const map = useMap();
  const pickupRef = useRef(pickup);
  const callbackRef = useRef(onPickupChange);

  const lastZoomRef = useRef(map.getZoom());
  // Centre as the map was handed to us (BASE_POINT), so the initial `setView`
  // and container resizes do not look like a user pan.
  const lastCenterRef = useRef({ lat: BASE_LOCATION.lat, lng: BASE_LOCATION.lng });
  const dragZoomRef = useRef(map.getZoom());
  const pickupTimerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const previewZoomRef = useRef(null);
  const previewingRef = useRef(false);

  useEffect(() => {
    pickupRef.current = pickup;
  }, [pickup]);

  useEffect(() => {
    callbackRef.current = onPickupChange;
  }, [onPickupChange]);

  // Never leave a timer running after unmount.
  useEffect(
    () => () => {
      clearTimeout(pickupTimerRef.current);
      clearTimeout(previewTimerRef.current);
    },
    []
  );

  // ── Route preview ────────────────────────────────────────────────────────
  // 1 s after the route loads, zoom out around the pickup so the full route
  // is on screen. `fitZoom - 1` because the view stays centred on one end of
  // the route instead of the middle.
  useEffect(() => {
    if (routeStatus !== "ready" || !route || !pickup) return;

    clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      const p = pickupRef.current;
      if (!p) return;

      const bounds = new LatLngBounds([BASE_POINT, [p.lat, p.lng]]);
      const fitZoom = map.getBoundsZoom(bounds, false, [40, 40]);
      // Never zoom in for the preview — a route that already fits stays put.
      const previewZoom = Math.min(
        map.getZoom(),
        Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), fitZoom - 1))
      );

      previewZoomRef.current = previewZoom;
      previewingRef.current = true;
      map.setZoomAround([p.lat, p.lng], previewZoom, { animate: true });
    }, 1000);

    return () => clearTimeout(previewTimerRef.current);
  }, [routeStatus, route, pickup, map]);

  // ── Pan vs zoom ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onMoveEnd = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      const p = pickupRef.current;

      if (zoom !== lastZoomRef.current) {
        lastZoomRef.current = zoom;

        // A zoom moved the centre (pinch, double-click or the zoom control) —
        // snap back so the crosshair stays on the pickup.
        if (p) map.setView([p.lat, p.lng], zoom, { animate: false });

        // Zooming in from the automatic preview puts the user back at the
        // zoom they were using while dragging.
        if (
          previewingRef.current &&
          previewZoomRef.current != null &&
          zoom > previewZoomRef.current &&
          p
        ) {
          previewingRef.current = false;
          previewZoomRef.current = null;
          map.setZoomAround([p.lat, p.lng], dragZoomRef.current, {
            animate: true,
          });
        }
        return;
      }

      // Same zoom → a pan. Remember this as the user's working zoom and
      // publish the new pickup point (debounced) — but only when the centre
      // actually moved, so the initial `setView` and container resizes do not
      // create a pickup at the office.
      dragZoomRef.current = zoom;
      const last = lastCenterRef.current;
      if (
        last &&
        Math.abs(center.lat - last.lat) < 1e-7 &&
        Math.abs(center.lng - last.lng) < 1e-7
      ) {
        return;
      }

      clearTimeout(pickupTimerRef.current);
      pickupTimerRef.current = setTimeout(() => {
        lastCenterRef.current = { lat: center.lat, lng: center.lng };
        callbackRef.current({ lat: center.lat, lng: center.lng });
      }, BOOKING_ROUTE_DEBOUNCE_MS);
    };

    map.on("moveend", onMoveEnd);
    return () => map.off("moveend", onMoveEnd);
  }, [map]);

  // A new drag cancels the preview and the saved zoom.
  useEffect(() => {
    const onDragStart = () => {
      clearTimeout(previewTimerRef.current);
      previewingRef.current = false;
      previewZoomRef.current = null;
    };
    map.on("dragstart", onDragStart);
    return () => map.off("dragstart", onDragStart);
  }, [map]);

  return null;
}

/** The map lives inside a height-animated card, so Leaflet has to be told
 *  when its container resizes or the tiles end up offset. */
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (typeof ResizeObserver === "undefined") {
      const timer = setTimeout(() => map.invalidateSize(), 250);
      return () => clearTimeout(timer);
    }
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function PickupMapPanel({ onRouteChange, onUnsupported }) {
  const [pickup, setPickup] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle"); // idle | loading | ready | error
  const [routeError, setRouteError] = useState("");
  const [webglAvailable, setWebglAvailable] = useState(true);

  const onRouteChangeRef = useRef(onRouteChange);
  useEffect(() => {
    onRouteChangeRef.current = onRouteChange;
  }, [onRouteChange]);

  const onUnsupportedRef = useRef(onUnsupported);
  useEffect(() => {
    onUnsupportedRef.current = onUnsupported;
  }, [onUnsupported]);

  useEffect(() => {
    setWebglAvailable(detectWebGL());
  }, []);

  useEffect(() => {
    if (!webglAvailable) onUnsupportedRef.current?.();
  }, [webglAvailable]);

  const handlePickupChange = useCallback((point) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    setPickup({ lat: point.lat, lng: point.lng });
    setRoute(null);
    setRouteStatus("loading");
    setRouteError("");
  }, []);

  // The MapController already waits 1.5 s after the last touch; this effect
  // only fetches. All setState calls live inside the async callback so the
  // effect body stays side-effect free.
  useEffect(() => {
    if (!pickup) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const result = await getDrivingRoute(BASE_LOCATION, pickup, {
          signal: controller.signal,
        });
        setRoute(result);
        setRouteStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") return;
        setRoute(null);
        setRouteStatus("error");
        setRouteError(
          error instanceof RoutingError
            ? "Could not calculate the driving route. Please enter the distance manually."
            : "Unexpected routing error — please enter the distance manually."
        );
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup]);

  // OSRM snaps the requested point onto the nearest road. The zone test uses
  // the snapped end so it agrees with the distance being priced.
  const snappedPickup = useMemo(() => {
    const coords = route?.geometry?.coordinates;
    const last = Array.isArray(coords) ? coords[coords.length - 1] : null;
    if (!Array.isArray(last) || last.length < 2) return pickup;

    const [lng, lat] = last;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return pickup;

    return { lat, lng };
  }, [route, pickup]);

  const servicePoint = snappedPickup ?? pickup;

  const zoneContains =
    servicePoint != null &&
    pointInPolygon(servicePoint, ZONE_GEOMETRIES.get("service"));
  const routeWithin = route ? route.distanceKm <= SERVICE_RADIUS_KM : null;
  const withinServiceArea = zoneContains && routeWithin !== false;
  const routeTooLong = zoneContains && routeWithin === false;

  // Report every meaningful change to the form so it can price, validate and
  // block a booking the homepage map would also reject.
  useEffect(() => {
    onRouteChangeRef.current?.({
      status: routeStatus,
      distanceKm: route?.distanceKm ?? null,
      withinServiceArea: pickup ? withinServiceArea : null,
      zoneContains: pickup ? zoneContains : null,
      routeTooLong,
      error: routeError,
    });
  }, [
    routeStatus,
    route,
    pickup,
    withinServiceArea,
    zoneContains,
    routeTooLong,
    routeError,
  ]);

  const routeKey = route
    ? `${route.geometry.coordinates.length}-${route.distanceKm.toFixed(2)}`
    : null;

  if (!webglAvailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <AlertTriangle size={20} className="mx-auto text-amber-500" />
        <p className="mt-2 text-xs font-medium text-amber-800">
          The interactive map needs WebGL, which this browser or device has
          turned off.
        </p>
        <p className="mt-1 text-[11px] text-amber-700">
          Enter your distance manually below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl shadow-sm ring-1 ring-gray-200">
        <MapContainer
          center={BASE_POINT}
          zoom={DEFAULT_ZOOM}
          maxBounds={LAHORE_MAX_BOUNDS}
          maxBoundsViscosity={0.8}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", ...mapThemeVars }}
          className="service-area-map h-[300px] sm:h-[360px]"
        >
          <VectorBaseLayer />
          <ZoomControl position="bottomright" />
          <AttributionControl position="bottomleft" />
          <MapController
            pickup={pickup}
            route={route}
            routeStatus={routeStatus}
            onPickupChange={handlePickupChange}
          />
          <MapResizer />

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

          <Marker position={BASE_POINT} icon={baseIcon}>
            <Popup>
              <strong>Razia Driving Center</strong>
              <br />
              28/A, S Block, Gulberg 2, Lahore
            </Popup>
          </Marker>

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

        {/* Fixed crosshair — the pickup point is always the map centre. */}
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="9" fill="none" stroke="#ffffff" strokeWidth="5" />
            <circle
              cx="15"
              cy="15"
              r="9"
              fill="none"
              stroke={MAP_THEME.routeColor}
              strokeWidth="2.5"
            />
            <line x1="15" y1="0" x2="15" y2="30" stroke="#ffffff" strokeWidth="5" />
            <line
              x1="15"
              y1="0"
              x2="15"
              y2="30"
              stroke={MAP_THEME.routeColor}
              strokeWidth="2.5"
            />
            <line x1="0" y1="15" x2="30" y2="15" stroke="#ffffff" strokeWidth="5" />
            <line
              x1="0"
              y1="15"
              x2="30"
              y2="15"
              stroke={MAP_THEME.routeColor}
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Hint — top centre, clear of the zoom control and attribution. */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-[1000] -translate-x-1/2">
          <span className="whitespace-nowrap rounded-full bg-gray-900/80 px-3 py-1 text-[11px] font-medium text-white">
            Drag the map to set your pickup point
          </span>
        </div>
      </div>

      {/* Status — mirrors the homepage map's in/out-of-area messaging. */}
      <div aria-live="polite" className="flex items-center gap-2 text-xs">
        {!pickup && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Set your pickup point on the map to see the distance and price.
          </span>
        )}

        {pickup && routeStatus === "loading" && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <Loader2 size={13} className="animate-spin" />
            Calculating driving route…
          </span>
        )}

        {pickup && routeStatus === "ready" && route && (
          <>
            <span className="font-dm-sans text-sm font-bold text-gray-900">
              {formatKm(route.distanceKm)} km
            </span>
            {withinServiceArea ? (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-600">
                <CheckCircle2 size={11} /> In service area
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                <AlertTriangle size={11} /> Outside service area
              </span>
            )}
          </>
        )}

        {pickup && routeStatus === "error" && (
          <span className="flex items-start gap-1.5 text-red-600">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{routeError}</span>
          </span>
        )}
      </div>

      {routeTooLong && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
          This pickup is inside the area on the map, but the driving route is
          over {SERVICE_RADIUS_KM} KM, so pick &amp; drop is not available here.
        </p>
      )}
    </div>
  );
}
