import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CarFront,
  Clock3,
  MapPin,
  Minus,
  Plus,
  Route,
} from "lucide-react";

import { useCountUp } from "../../hooks/useCountUp";
import PickupMapPanel from "../SlotAvailability/PickupMapPanel";
import {
  DAYS_STEP,
  MAX_DAYS,
  MAX_DISTANCE_KM,
  MAX_MINUTES,
  MIN_DAYS,
  MIN_MINUTES,
  MINUTES_STEP,
  PICKDROP_RATE_PER_KM,
  ROUND_TRIP_MULTIPLIER,
  formatRs,
} from "../../lib/ownVehiclePricing";

// "5" instead of "5.0", but "3.5" keeps its decimal.
const formatHours = (hours) =>
  Number.isInteger(hours) ? String(hours) : hours.toFixed(1);

// Keep digits and a single decimal point while the visitor types a distance.
const sanitizeDistanceInput = (value) => {
  const only = value.replace(/[^0-9.]/g, "");
  const parts = only.split(".");
  return parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : only;
};

// One labelled slider with "-" / "+" steppers and the current value in large
// numerals. The native range input handles arrow / Home / End keys.
function CourseSlider({ id, label, value, min, max, step, unit, onChange }) {
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
        <p className="font-dm-sans text-3xl font-black leading-none text-gray-900">
          {value}
          <span className="ml-1 text-xs font-bold uppercase tracking-wide text-gray-400">
            {unit}
          </span>
        </p>
      </div>

      <div className="mt-1 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onChange(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="ov-step flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
        >
          <Minus size={16} />
        </button>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`${value} ${unit.toLowerCase()}`}
          className="ov-slider flex-1"
          style={{ "--ov-fill": `${fill}%` }}
        />

        <button
          type="button"
          onClick={() => onChange(value + step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="ov-step flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex justify-between text-[11px] font-medium text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-gray-100">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="font-dm-sans mt-0.5 text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

// Card 1 — the course calculator. Reads and writes the shared
// useOwnVehicleBooking state so Steps 2 and 3 reuse the same selections.
export default function CourseCalculator({ booking, onContinue }) {
  const {
    days,
    minutes,
    homeService,
    distanceKm,
    address,
    setDays,
    setMinutes,
    setHomeService,
    setDistanceKm,
    setAddress,
    pricing,
  } = booking;

  // Count-up on the total; the hook disables itself under prefers-reduced-motion.
  const animatedTotal = useCountUp(pricing.total, 500);

  // ── Pick & drop: address + pickup map + distance ──────────────────────────
  // The shared distance lives in `booking` (Card 3 reads it for the price and
  // the submit), but a typed draft is kept so "0.5" can be typed without the
  // field snapping to "0" halfway through.
  const [distanceDraft, setDistanceDraft] = useState("");
  const [distanceEdited, setDistanceEdited] = useState(false);
  const [distanceCapped, setDistanceCapped] = useState(false);
  // The last value this component pushed into the shared state — used to tell
  // "the map changed it" apart from "we just changed it".
  const pushedDistanceRef = useRef(distanceKm);

  const shownDistance = distanceEdited ? distanceDraft : String(distanceKm);
  const distanceNum = Number(shownDistance) || 0;

  useEffect(() => {
    if (distanceKm === pushedDistanceRef.current) return;
    pushedDistanceRef.current = distanceKm;
    setDistanceDraft(String(distanceKm));
    setDistanceEdited(false);
    setDistanceCapped(false);
  }, [distanceKm]);

  // Pickup-map report: { status, distanceKm, withinServiceArea, zoneContains,
  // routeTooLong, error }. `null` until the map has reported.
  const [routeInfo, setRouteInfo] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [pickDropError, setPickDropError] = useState("");

  // Turning Pick & Drop off clears the map-derived distance so a later "on"
  // starts fresh.
  const handlePickupToggle = useCallback(
    (on) => {
      setHomeService(on);
      setPickDropError("");
      if (!on) {
        pushedDistanceRef.current = 0;
        setDistanceDraft("");
        setDistanceEdited(false);
        setDistanceCapped(false);
        setDistanceKm(0);
        setRouteInfo(null);
        setLocationStatus("idle");
        setLocationError("");
      }
    },
    [setDistanceKm, setHomeService]
  );

  // A ready route overwrites whatever distance was there — the map is
  // authoritative. Manual entry still works as a fallback.
  const handleRouteChange = useCallback(
    (info) => {
      setRouteInfo(info);
      if (info?.status === "ready" && Number.isFinite(info.distanceKm)) {
        const over = info.distanceKm > MAX_DISTANCE_KM;
        const capped = over
          ? MAX_DISTANCE_KM
          : Number(info.distanceKm.toFixed(2));
        pushedDistanceRef.current = capped;
        setDistanceEdited(true);
        setDistanceDraft(String(capped));
        setDistanceCapped(over);
        setDistanceKm(capped);
        setPickDropError("");
      } else if (info?.status === "loading" || info?.status === "error") {
        // Never price a distance that is no longer current.
        pushedDistanceRef.current = 0;
        setDistanceEdited(true);
        setDistanceDraft("");
        setDistanceCapped(false);
        setDistanceKm(0);
      }
    },
    [setDistanceKm]
  );

  const openMaps = (origin) => {
    setLocationStatus("opening");
    const directionsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      (origin ? `&origin=${origin}` : "") +
      `&destination=31.5201889,74.3575145`;
    window.open(directionsUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setLocationStatus("idle"), 1500);
  };

  // Same "Check distance" behaviour as the slot-page booking form: it opens
  // Google Maps directions so the visitor can measure the route themselves.
  const handleCheckDistance = async () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location detection — opening Google Maps so you can check the route manually."
      );
      openMaps(null);
      return;
    }
    setLocationError("");
    setLocationStatus("locating");

    let permissionState = "prompt";
    if (navigator.permissions) {
      try {
        const res = await navigator.permissions.query({ name: "geolocation" });
        permissionState = res.state;
      } catch {
        // permissions API unsupported — fall through
      }
    }

    if (permissionState === "denied") {
      setLocationStatus("idle");
      setLocationError(
        "Location permission is blocked in your browser settings. Please enable it, or use Google Maps below to check your route."
      );
      openMaps(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        openMaps(`${latitude},${longitude}`);
      },
      (error) => {
        setLocationStatus("idle");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access was denied. Please allow it in your browser settings and try again."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Location detection timed out. Opening Google Maps instead."
            );
            break;
          default:
            setLocationError(
              "Your location could not be detected. Opening Google Maps instead."
            );
            break;
        }
        openMaps(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDistanceChange = (e) => {
    const raw = sanitizeDistanceInput(e.target.value);
    const num = raw === "" ? 0 : Number(raw);
    const over = Number.isFinite(num) && num > MAX_DISTANCE_KM;
    const capped = over
      ? MAX_DISTANCE_KM
      : Number.isFinite(num)
        ? num
        : 0;
    pushedDistanceRef.current = capped;
    setDistanceEdited(true);
    setDistanceDraft(over ? String(MAX_DISTANCE_KM) : raw);
    setDistanceCapped(over);
    setDistanceKm(capped);
    setPickDropError("");
  };

  // Card 1 owns the pick & drop setup, so it makes sure that setup is complete
  // before the visitor moves on to choosing a slot.
  const handleContinue = () => {
    if (homeService) {
      if (!address.trim() || address.trim().length < 5) {
        setPickDropError("Please enter your complete pickup address.");
        return;
      }
      if (!distanceNum || distanceNum <= 0) {
        setPickDropError("Set your pickup on the map or enter a distance.");
        return;
      }
      if (routeInfo?.withinServiceArea === false) {
        setPickDropError(
          routeInfo.routeTooLong
            ? "The driving route is over 20 KM — pick & drop is not available here."
            : "This pickup is outside our 20 KM service area."
        );
        return;
      }
    }
    setPickDropError("");
    onContinue();
  };

  return (
    <section
      aria-labelledby="own-vehicle-calculator-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Card header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6201]">
          <CarFront size={22} />
        </div>
        <div>
          <h2
            id="own-vehicle-calculator-heading"
            className="text-lg font-extrabold text-gray-900"
          >
            Build Your Course
          </h2>
          <p className="text-xs text-gray-500">
            Adjust the knobs — your price updates live.
          </p>
        </div>
      </div>

      {/* Sliders — full width, so the live summary can sit beside the tall
          pick & drop block below instead of leaving an empty column. */}
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <CalendarDays size={12} className="text-[#FF6201]" />
            Course Length
          </div>
          <CourseSlider
            id="course-days"
            label="Course Duration"
            value={days}
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={DAYS_STEP}
            unit="Days"
            onChange={setDays}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <Clock3 size={12} className="text-[#FF6201]" />
            Daily Lesson Time
          </div>
          <CourseSlider
            id="course-minutes"
            label="Daily Lesson Duration"
            value={minutes}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={MINUTES_STEP}
            unit="Minutes"
            onChange={setMinutes}
          />
        </div>
      </div>

      {/* Pick & drop + live summary. On phones the summary comes first so the
          live price is visible before the map; on desktop the summary stretches
          to the height of the pick & drop block so no column is left empty. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-stretch">
        {/* Live summary */}
        <div className="order-1 flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50 p-4 lg:order-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Your Training Plan
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Training Days" value={days} />
            <Stat label="Daily Duration" value={`${minutes} min`} />
            <Stat label="Total Hours" value={formatHours(pricing.totalHours)} />
            <Stat label="Per Day" value={formatRs(pricing.perDayPrice)} />
          </div>

          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Course Fee</span>
              <span className="font-dm-sans font-semibold text-gray-900">
                {formatRs(pricing.courseFee)}
              </span>
            </div>
            <p className="text-[11px] leading-4 text-gray-400">
              {days} days x {formatRs(pricing.perDayPrice)} ={" "}
              {formatRs(pricing.courseFee)}
            </p>

            {homeService && (
              <>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Pick &amp; Drop</span>
                  <span className="font-dm-sans font-semibold text-gray-900">
                    {formatRs(pricing.pickDropCharge)}
                  </span>
                </div>
                <p className="text-[11px] leading-4 text-gray-400">
                  {days} days x {formatRs(PICKDROP_RATE_PER_KM)} x {distanceKm}{" "}
                  km x {ROUND_TRIP_MULTIPLIER} (round trip) ={" "}
                  {formatRs(pricing.pickDropCharge)}
                </p>
              </>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-extrabold text-gray-900">Total</span>
            <span
              className="font-dm-sans text-3xl font-black leading-none text-gray-900"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatRs(animatedTotal)}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-gray-400">
            Final price is confirmed by our team before your booking is confirmed.
          </p>
        </div>

        {/* Pick & drop — the toggle, address, map and distance all live here. */}
        <div className="order-2 rounded-xl border border-gray-200 p-4 lg:order-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF6201]">
                <Route size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Pick &amp; Drop at Your Doorstep
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  The instructor picks you up and drops you back after every
                  lesson.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={homeService}
              aria-label="Pick and drop at your doorstep"
              onClick={() => handlePickupToggle(!homeService)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40 ${
                homeService ? "bg-[#FF6201]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  homeService ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {homeService && (
            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
              {/* Address */}
              <div>
                <label
                  htmlFor="own-vehicle-address"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"
                >
                  <MapPin size={12} />
                  Pickup / Drop-off Address
                </label>
                <input
                  id="own-vehicle-address"
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete pickup address"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#FF6201] focus:ring-2 focus:ring-[#FF6201]/20"
                />
              </div>

              {/* Pickup map */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-gray-600">
                  Set your pickup point
                </p>
                <PickupMapPanel onRouteChange={handleRouteChange} />

                {routeInfo?.withinServiceArea === false &&
                  !routeInfo?.routeTooLong && (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                      This pickup point is outside our 20 KM service area, so
                      pick &amp; drop is not available here.
                    </p>
                  )}
              </div>

              {/* Distance — typed, capped at 20 km */}
              <div>
                <label
                  htmlFor="own-vehicle-distance"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Distance from our center (KM)
                </label>
                {distanceCapped && (
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <AlertTriangle size={12} className="shrink-0" />
                    Capped at {MAX_DISTANCE_KM} km — pick &amp; drop is
                    available up to {MAX_DISTANCE_KM} km.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      id="own-vehicle-distance"
                      type="text"
                      inputMode="decimal"
                      value={shownDistance}
                      onChange={handleDistanceChange}
                      placeholder="e.g. 5"
                      className="font-dm-sans w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#FF6201] focus:ring-2 focus:ring-[#FF6201]/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckDistance}
                    disabled={locationStatus !== "idle"}
                    className="flex h-[38px] shrink-0 items-center justify-center rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40 disabled:opacity-60"
                  >
                    {locationStatus === "idle"
                      ? "Check distance"
                      : locationStatus === "locating"
                        ? "Locating…"
                        : "Opening…"}
                  </button>
                </div>
                {locationError && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {locationError}
                  </p>
                )}
              </div>

              {pickDropError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {pickDropError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Continue — scrolls down to Card 2 (the slot picker). */}
      <div className="mt-5 flex flex-col items-center gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-between">
        <p className="text-xs text-gray-400">
          Next: pick your start date and time.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-gray-900 px-6 text-sm font-bold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
