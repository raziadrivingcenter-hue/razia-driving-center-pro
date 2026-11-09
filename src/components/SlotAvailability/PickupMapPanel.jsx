/* ------------------------------------------------------------------ */
/*  PickupMapPanel — interactive Leaflet map for the booking form.     */
/*                                                                    */
/*  The customer sets a pickup point by tapping the map or dragging    */
/*  the pin — exactly the interaction the homepage service-area map    */
/*  uses, so the two maps behave identically. The driving route comes  */
/*  from the existing routing service (src/lib/routingService.js) and  */
/*  its distance is reported to the booking form, which prices it with */
/*  the existing pickDropCalculator engine — no pricing logic is       */
/*  duplicated here.                                                  */
/*                                                                    */
/*  The service-area check uses the same road-based zones as the       */
/*  homepage map, so the booking form cannot accept a pickup the       */
/*  homepage would reject. If routing fails we report the error and    */
/*  the form falls back to a manual distance entry.                   */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import routeIcon from "../../assets/route2.svg";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  ZoomControl,
  AttributionControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  BASE_LOCATION,
  SERVICE_RADIUS_KM,
  LAHORE_MAX_BOUNDS,
  SERVICE_AREA_FIT_BOUNDS,
  DEFAULT_ZOOM,
  MAX_ROUTE_ZOOM,
  ROUTE_FIT_PADDING_PX,
  ROUTE_DEBOUNCE_MS,
  MAP_THEME,
} from "../../lib/serviceAreaConfig";
import { getDrivingRoute, haversineKm, RoutingError } from "../../lib/routingService";
import { pointInPolygon } from "../../lib/pointInPolygon";
import { SERVICE_ZONE, FREE_ZONE, ZONE_GEOMETRIES } from "../../lib/serviceZones";
import { baseIcon, pickupIcon, detectWebGL, mapThemeVars } from "../../lib/mapShared";
import VectorBaseLayer from "../ServiceAreaMap/VectorBaseLayer";

const BASE_POINT = [BASE_LOCATION.lat, BASE_LOCATION.lng];

const formatKm = (value) => Number(value).toFixed(1);

/** Tap anywhere on the map to drop / move the pin. */
function MapClickHandler({ onPick }) {
  useMapEvents({
    click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}

/** Opening viewport — wide enough to show the whole service radius.
 *
 *  Same fit as the homepage map. The booking card animates its height open,
 *  so fitting bounds as it grows would frame the map for a half-open box and
 *  then keep that zoom once the card is full size. Wait for the size to
 *  settle, and never fit into a box with no height at all. */
function FitServiceArea() {
  const map = useMap();

  useEffect(() => {
    let timer = null;

    const fit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (map.getSize().y < 100) return;
        map.fitBounds(SERVICE_AREA_FIT_BOUNDS, { maxZoom: MAX_ROUTE_ZOOM });
      }, 250);
    };

    fit();

    if (typeof ResizeObserver === "undefined") {
      const poll = setInterval(fit, 100);
      return () => {
        clearTimeout(timer);
        clearInterval(poll);
      };
    }

    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
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

  // A tap or a pin drag lands here once per interaction, so the homepage's
  // short debounce is enough. All setState calls live inside the async
  // callback so the effect body stays side-effect free.
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
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup]);

  // OSRM snaps the requested point onto the nearest road. The pin is drawn at
  // the snapped end so it agrees with the distance being priced and with the
  // zone test below. `pickup` stays the customer's raw choice — re-routing
  // from the snapped point would feed the route back into itself.
  const snappedPickup = useMemo(() => {
    const coords = route?.geometry?.coordinates;
    const last = Array.isArray(coords) ? coords[coords.length - 1] : null;
    if (!Array.isArray(last) || last.length < 2) return pickup;

    const [lng, lat] = last;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return pickup;

    return { lat, lng };
  }, [route, pickup]);

  const servicePoint = snappedPickup ?? pickup;
  const straightLineKm = servicePoint
    ? haversineKm(BASE_LOCATION, servicePoint)
    : null;

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
      // The verified pickup coordinates. Sent to the server when paying by
      // card so the price is recalculated from the map, never from a typed
      // distance. Primitives in the deps below keep this effect from refiring.
      pickupLat: servicePoint?.lat ?? null,
      pickupLng: servicePoint?.lng ?? null,
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
    servicePoint?.lat,
    servicePoint?.lng,
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

          <MapClickHandler onPick={handlePickupChange} />
          <FitServiceArea />
          <FitRoute route={route} />
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

          {/* Center marker */}
          <Marker position={BASE_POINT} icon={baseIcon}>
            <Popup>
              <strong>Razia Driving Center</strong>
              <br />
              28/A, S Block, Gulberg 2, Lahore
            </Popup>
          </Marker>

          {/* Pickup pin — draggable, keyboard-movable, exactly like the
              homepage map. Drawn at the road-snapped end of the route, not
              the raw drop point. */}
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
      </div>

      {/* Status — mirrors the homepage map's in/out-of-area messaging. */}
      <div aria-live="polite" className="flex items-center gap-2 text-xs">
        {!pickup && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Tap the map or drag the pin to see your distance and price.
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
            <img src={routeIcon} alt="" className="h-3.5 w-3.5 shrink-0" />
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
