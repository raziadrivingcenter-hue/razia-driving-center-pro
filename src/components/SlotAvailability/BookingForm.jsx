import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  CheckCircle2,
  LoaderCircle,
  AlertTriangle,
  MapPin,
  XCircle,
} from "lucide-react";

import { submitSlotBooking } from "../../lib/slotAvailability";
import { courses } from "../../data/courses";
import { calculateTotalPayable, getPlanType } from "../../lib/pickDropCalculator";
import courseDiaryIcon from "../../assets/coursediary.svg";
import PickupMapPanel from "./PickupMapPanel";

function formatTime12(timeStr) {
  // "09:00" or "09:00:00" → "9:00 AM"
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

// Compact course selector — horizontal chips reusing course data.
// Stores the display title (PLUS Plan) which is what goes to the DB.

// "7 Days Training" → { n: "7", rest: "Days" } — the numeral is split out so it
// can render in DM Sans while the words stay in the body face (site convention,
// see CourseCard: "Free Pick & Drop Upto <Num>2</Num> Km").
const durationParts = (c) => {
  const label = c.duration.replace(/\s*Training\s*$/i, "").trim();
  const m = label.match(/^(\d+)\s*(.*)$/);
  return m ? { n: m[1], rest: m[2] } : { n: null, rest: label };
};

// First "30 Minutes Daily …" feature → { n: "30", rest: "min daily" }
const dailyParts = (c) => {
  const feat = c.features.find((f) => /minutes daily/i.test(f.text));
  const mins = feat?.text.match(/(\d+)\s*minutes/i)?.[1];
  return mins ? { n: mins, rest: "min daily" } : null;
};

// Plain string form of a { n, rest } pair — for aria-labels and non-numeric slots.
const partsLabel = (parts) =>
  parts ? (parts.n ? `${parts.n} ${parts.rest}` : parts.rest) : "";

// Renders "30 min daily" with the numeral in DM Sans and the words in the body face.
function Num({ n, rest }) {
  if (!n) return rest;
  return (
    <>
      <span className="font-dm-sans">{n}</span> {rest}
    </>
  );
}

function CourseSelect({ value, onChange, error }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gray-600">Select Course</p>
      <div className="grid grid-cols-3 gap-2">
        {courses.map((c) => {
          const selected = value === c.title;
          const dur = durationParts(c);
          const daily = dailyParts(c);
          return (
            <div key={c.name} className="group relative">
              <button
                type="button"
                onClick={() => onChange(c.title)}
                aria-label={`${c.title}, ${c.price}, ${partsLabel(dur)}${
                  daily ? `, ${partsLabel(daily)}` : ""
                }`}
                className={`
                  w-full rounded-lg border px-2 py-2 text-center transition
                  ${
                    selected
                      ? "border-[#FF6201] bg-orange-50 ring-2 ring-[#FF6201]/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }
                `}
              >
                <span
                  className={`block text-[11px] font-bold ${
                    selected ? "text-[#FF6201]" : "text-gray-700"
                  }`}
                >
                  {c.title}
                </span>
                <span className="font-dm-sans block text-[10px] font-medium text-gray-400">
                  {c.price}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-gray-500">
                  <Num n={dur.n} rest={dur.rest} />
                  {daily ? (
                    <>
                      {" "}
                      <span>·</span> <Num n={daily.n} rest={daily.rest} />
                    </>
                  ) : null}
                </span>
              </button>

              {/* Hover card — pointer devices only (touch gets the plain chip). */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 hidden w-56 -translate-x-1/2 translate-y-1 opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:block"
              >
                <div className="relative rounded-xl bg-gray-900 p-3.5 text-left shadow-2xl ring-1 ring-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-white">
                      {c.title}
                    </span>
                    {c.titleIcon && (
                      <c.titleIcon size={11} className="shrink-0 text-[#FF6201]" />
                    )}
                  </div>

                  {c.badge && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#FF6201]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF6201]">
                      <c.badge.icon size={9} />
                      {c.badge.text}
                    </span>
                  )}

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-dm-sans text-sm font-bold text-[#FF6201]">
                      {c.price}
                    </span>
                    <span className="font-dm-sans text-[10px] text-white/35 line-through">
                      {c.oldPrice}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white/5 px-2 py-1.5 ring-1 ring-white/5">
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/40">
                        Duration
                      </p>
                      <p className="font-dm-sans text-[11px] font-bold text-white">
                        {partsLabel(dur)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-2 py-1.5 ring-1 ring-white/5">
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/40">
                        Daily
                      </p>
                      <p className="font-dm-sans text-[11px] font-bold text-white">
                        {daily ? partsLabel(daily) : "—"}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
                    {c.features.slice(0, 4).map((f) => (
                      <li key={f.text} className="flex items-center gap-1.5">
                        <f.icon size={10} className="shrink-0 text-[#FF6201]" />
                        <span className="truncate text-[10px] text-white/70">
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Pointer aimed back at the course chip */}
                  <span className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-gray-900" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// The grand total. Shown inside the pricing card on mobile and in the card
// footer on desktop, so the customer always sees it without scrolling.
function PricingTotal({ pricing, discount }) {
  const totalPayable = pricing.courseFee + pricing.pickDropCharges - discount;

  return (
    <>
      {/* Total Payable — the one number the customer is here for, so it is
          drawn at 3× the size of every other line in the card. */}
      <div className="mt-2 flex items-end justify-between gap-3 border-t border-gray-200 pt-2">
        <span className="text-base font-extrabold text-gray-900">Total Payable</span>
        <span className="font-dm-sans text-right text-4xl font-black leading-none text-gray-900">
          Rs. {totalPayable.toLocaleString()}
        </span>
      </div>

      <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
        Final price confirmed by our team before booking confirmation.
      </p>
    </>
  );
}

// Pricing summary — rendered directly under the pickup map so the customer
// sees the distance, the charge calculation and the total without scrolling
// past the form. Every number comes from the pricing engine; only the layout
// lives here.
function PricingSummary({ pricing, discount, promoMatches, promoPercent }) {
  // Trim floating-point noise from the display (5.86 - 2 should read as
  // 3.86 km, not 3.8599999999999999 km).
  const km = (value) => Number(Number(value).toFixed(2));
  // Effective per-km rate across the whole course (rate × days × round trip).
  const perKmRate = pricing.effectiveRatePerKm;
  const withinFree = pricing.freeKm > 0 && pricing.distanceKm <= pricing.freeKm;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      {/* Course fee */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Course Fee</span>
        <span className="font-dm-sans font-semibold text-gray-800">
          Rs. {pricing.courseFee.toLocaleString()}
        </span>
      </div>

      {/* Pick & Drop + the calculation behind it */}
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-gray-500">Pick &amp; Drop</span>
        <span className="font-dm-sans font-semibold text-gray-800">
          Rs. {pricing.pickDropCharges.toLocaleString()}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
        {withinFree ? (
          "Within free distance"
        ) : pricing.freeKm > 0 ? (
          <>
            {km(pricing.distanceKm)} km &minus; {km(pricing.freeKm)} km free ={" "}
            {km(pricing.chargeableKm)} km &times; Rs.{" "}
            {perKmRate.toLocaleString()}
          </>
        ) : (
          <>
            {km(pricing.distanceKm)} km &times; Rs. {perKmRate.toLocaleString()}
          </>
        )}
      </p>

      {/* Area discount — only when the tile promo matches the visitor's area */}
      {promoMatches && discount > 0 && (
        <>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Area discount ({promoPercent}% off pick &amp; drop)
            </span>
            <span className="font-dm-sans font-semibold text-green-600">
              &minus; Rs. {discount.toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
            {promoPercent}% of Rs. {pricing.pickDropCharges.toLocaleString()} = Rs.{" "}
            {discount.toLocaleString()}
          </p>
        </>
      )}

      {/* Desktop moves the total into the card footer; the breakdown stays
          in this card. */}
      <div className="lg:hidden">
        <PricingTotal pricing={pricing} discount={discount} />
      </div>
    </div>
  );
}

export default function BookingForm({
  slot,
  date,
  area,
  promoPercent,
  promoArea,
  onBack,
  prefill,
}) {
  // Pre-select course when arriving from a course card (?course=...) or the
  // student dashboard. The dashboard also hands off a verified name + Supabase
  // access token via sessionStorage (consumed in SlotAvailability and passed
  // here as `prefill`). The token proves identity server-side; the email is
  // derived from the verified Auth user and is NEVER an editable field here.
  const initialCourse = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("course") || "";
  }, []);

  // Supabase session JWT (dashboard only) — sent as an Authorization header.
  // Public visitors have no token, so the booking's email column stays NULL.
  const accessToken = prefill?.accessToken || "";

  const [name, setName] = useState(prefill?.name || "");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState(initialCourse);
  // Default Pick & Drop to Yes when a real area is selected; visitor can override.
  const [pickup, setPickup] = useState(() => (area ? "Yes" : "No"));
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState("");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  // Pickup-map report: { status, distanceKm, withinServiceArea, zoneContains,
  // routeTooLong, error, estimateKm }. `null` until the map has reported.
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapUnsupported, setMapUnsupported] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const wantsPickDrop = pickup === "Yes";
  const distanceNum = Number(distance) || 0;

  // The map is the primary way to set the pickup point. Turning Pick & Drop
  // off clears the map-derived distance so a later "Yes" starts fresh.
  const handlePickupToggle = useCallback((opt) => {
    setPickup(opt);
    if (opt === "No") {
      setDistance("");
      setRouteInfo(null);
      setMapUnsupported(false);
      setManualOpen(false);
      setLocationStatus("idle");
      setLocationError("");
    }
  }, []);

  // A ready route overwrites whatever distance was there — the map is
  // authoritative. Manual entry still works as a fallback.
  const handleRouteChange = useCallback((info) => {
    setRouteInfo(info);
    if (info?.status === "ready" && Number.isFinite(info.distanceKm)) {
      setDistance(String(Number(info.distanceKm.toFixed(2))));
    } else if (info?.status === "loading" || info?.status === "error") {
      // Never show a price for a distance that is no longer current.
      setDistance("");
    }
  }, []);

  // Routing can fail or WebGL can be missing — reveal the manual entry then,
  // so a map problem never blocks the booking.
  useEffect(() => {
    if (mapUnsupported || routeInfo?.status === "error") {
      // Revealing the manual field is a direct response to the map failing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManualOpen(true);
    }
  }, [mapUnsupported, routeInfo?.status]);

  // `course` holds the display title (e.g. "PLUS Plan"). The pricing engine
  // keys off the internal name, so resolve it for the calculation only.
  const courseInternal = course
    ? courses.find((c) => c.title === course)?.name || course
    : "";

  // Live pricing preview (mirrors the booking wizard).
  const pricing =
    wantsPickDrop && distanceNum > 0 && courseInternal
      ? calculateTotalPayable(courseInternal, distanceNum, true, {
          planType: getPlanType(courseInternal),
        })
      : null;

  // Normalize an area string for comparison: trim, lowercase, collapse spaces.
  const normalize = (a) =>
    (a || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Area discount: only when Pick & Drop is on, the selected tile carries a
  // promo, and the visitor's area matches the tile's promo_area (normalized).
  // The server is the authority on the discount; this is a display preview.
  const promoMatches =
    wantsPickDrop &&
    pricing &&
    promoPercent &&
    promoArea &&
    area &&
    normalize(area) === normalize(promoArea);
  const discount = promoMatches
    ? Math.round(pricing.pickDropCharges * (promoPercent / 100))
    : 0;

  // The pricing card (and the footer total) only make sense once a course is
  // chosen, a distance exists and the pickup is inside the service area.
  const showPricing =
    !!pricing &&
    pricing.courseFee > 0 &&
    routeInfo?.withinServiceArea !== false;

  // Open Google Maps directions. If origin is null, Maps uses its own
  // location detection (works even when the browser geolocation API is blocked).
  const openMaps = (origin) => {
    setLocationStatus("opening");
    const directionsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      (origin ? `&origin=${origin}` : "") +
      `&destination=31.5201889,74.3575145`;
    window.open(directionsUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setLocationStatus("idle"), 1500);
  };

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

    // Check permission state first — if previously denied, the browser will
    // NOT show a popup; it fires the error callback immediately.
    let permissionState = "prompt";
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        permissionState = result.state;
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
            setLocationError("Location detection timed out. Opening Google Maps instead.");
            break;
          default:
            setLocationError("Your location could not be detected. Opening Google Maps instead.");
            break;
        }
        // Always fall back to Google Maps so the user can still check the route
        openMaps(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!phone.trim()) e.phone = "Please enter your phone number";
    if (!course) e.course = "Please select a course";
    if (wantsPickDrop) {
      if (!address.trim()) e.address = "Please enter your pickup address";
      else if (address.trim().length < 5) e.address = "Please enter a complete address";
      if (!distanceNum || distanceNum <= 0) {
        e.distance = "Set your pickup on the map or enter a distance";
      } else if (distanceNum > 20) {
        e.distance = "Pick & Drop is available up to 20 KM";
      }
      if (routeInfo?.withinServiceArea === false) {
        e.distance = routeInfo.routeTooLong
          ? "The driving route is over 20 KM — pick & drop is not available here"
          : "This pickup is outside our 20 KM service area";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await submitSlotBooking({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        preferred_date: date,
        preferred_time: slot.time,
        course,
        distance_km: wantsPickDrop ? distanceNum : 0,
        home_service: wantsPickDrop,
        address: wantsPickDrop ? address.trim() : "",
        area,
        accessToken,
      });
      setResult(res);
    } catch (err) {
      // A 401 means the dashboard session token was invalid/expired — guide the
      // student back to sign-in rather than showing a generic failure.
      const msg =
        err.status === 401 || /sign-in|expired|invalid/i.test(err.message || "")
          ? err.message ||
            "Your sign-in expired. Please sign in again to book your slot."
          : err.details?.join(", ") ||
            err.message ||
            "Something went wrong. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!result ? (
        /* ── Registration form ── */
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className={`mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${
            // With the map open the card takes the full content width and
            // splits into two columns, so the wizard reads as a landscape
            // panel instead of a tall column that scrolls.
            wantsPickDrop ? "lg:max-w-6xl" : ""
          }`}
        >
          <div className="relative">
          {/* Back + slot summary */}
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800"
            >
              <ArrowLeft size={16} className="text-[#FF6201]" />
              Back to slots
            </button>
            <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-right">
              <span className="font-dm-sans text-xs font-medium text-gray-500">{date}</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-dm-sans text-xs font-bold text-[#FF6201]">
                {formatTime12(slot.time)}
              </span>
            </div>
          </div>

          {/* Heading + course-diary mark — heading block left, mark right, one band. */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">Complete Your Booking</h3>
              <p className="text-xs text-gray-500">Fill in your details to reserve this slot.</p>
            </div>
            <img
              src={courseDiaryIcon}
              alt=""
              aria-hidden="true"
              className="h-7 w-7 shrink-0"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            {/* Desktop (lg+): two columns — visitor and course details on the
                left, the pickup map and its price on the right, so the wizard
                reads as a landscape panel instead of a tall scrolling column.
                Mobile keeps the original single-column order. */}
            <div
              className={`flex flex-col gap-4 ${
                wantsPickDrop
                  ? "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-6"
                  : ""
              }`}
            >
              {/* ── Left: visitor, course and pickup details ── */}
              <div className="space-y-4">
                {/* Name + Phone */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <User size={12} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ali Hassan"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                        errors.name
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <Phone size={12} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0300 1234567"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                        errors.phone
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                {/* Course */}
                <CourseSelect value={course} onChange={setCourse} error={errors.course} />

                {/* Pick & Drop */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-600">
                    Need Pick & Drop service?
                  </p>
                  <div className="flex gap-2">
                    {["Yes", "No"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handlePickupToggle(opt)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          pickup === opt
                            ? "border-[#FF6201] bg-orange-50 text-[#FF6201]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address — part of the pick & drop details, so it sits in
                    the left column on desktop. */}
                <AnimatePresence>
                  {wantsPickDrop && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <MapPin size={12} />
                          Pickup / Drop-off Address
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your complete pickup address"
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                            errors.address
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                          }`}
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Right: the pickup map and the price it produces ── */}
              <AnimatePresence>
                {wantsPickDrop && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Pickup map — drag to put your pickup under the
                          crosshair. The route is fetched 1.5 s after the last
                          map touch and its distance feeds the existing pricing
                          engine. */}
                      <PickupMapPanel
                        onRouteChange={handleRouteChange}
                        onUnsupported={() => setMapUnsupported(true)}
                      />

                      {routeInfo?.withinServiceArea === false &&
                        !routeInfo?.routeTooLong && (
                          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                            This pickup point is outside our 20 KM service area,
                            so pick &amp; drop is not available here.
                          </p>
                        )}

                      {showPricing && (
                        <PricingSummary
                          pricing={pricing}
                          discount={discount}
                          promoMatches={promoMatches}
                          promoPercent={promoPercent}
                        />
                      )}

                      {errors.distance && (
                        <p className="text-xs font-medium text-red-500">{errors.distance}</p>
                      )}

                      <button
                        type="button"
                        onClick={() => setManualOpen((open) => !open)}
                        className="text-xs font-semibold text-gray-500 underline transition hover:text-gray-700"
                      >
                        {manualOpen ? "Hide manual distance" : "Enter distance manually"}
                      </button>

                      {manualOpen && (
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              Distance (KM)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={distance}
                              onChange={(e) => {
                                const only = e.target.value.replace(/[^0-9.]/g, "");
                                const parts = only.split(".");
                                const sanitized =
                                  parts.length > 2
                                    ? parts[0] + "." + parts.slice(1).join("")
                                    : only;
                                setDistance(sanitized);
                              }}
                              placeholder="e.g. 5"
                              className={`font-dm-sans w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                                errors.distance
                                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                  : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                              }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleCheckDistance}
                            disabled={locationStatus !== "idle"}
                            className="flex h-[38px] shrink-0 items-center justify-center rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
                          >
                            {locationStatus === "idle"
                              ? "Check"
                              : locationStatus === "locating"
                              ? "Locating…"
                              : "Opening…"}
                          </button>
                        </div>
                      )}

                      {distanceNum > 20 && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                          <XCircle size={12} className="shrink-0" />
                          Pick & Drop is available up to 20 KM.
                        </p>
                      )}
                      {locationError && (
                        <p className="text-xs font-medium text-red-500">{locationError}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {submitError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Footer — on desktop the total sits beside the submit button; on
                mobile the total already lives inside the pricing card, so the
                button stands alone. */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                {showPricing && (
                  <div className="hidden lg:block">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-extrabold text-gray-900">
                        Total Payable
                      </span>
                      <span className="font-dm-sans text-4xl font-black leading-none text-gray-900">
                        Rs.{" "}
                        {(
                          pricing.courseFee +
                          pricing.pickDropCharges -
                          discount
                        ).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Final price confirmed by our team before booking confirmation.
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                    showPricing ? "w-full lg:w-auto" : "w-full"
                  }`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Reserving…
                    </>
                  ) : (
                    "Reserve Slot"
                  )}
                </button>
              </div>
            </div>
          </form>
          </div>
        </motion.div>
      ) : (
        /* ── Confirmation ── */
        <motion.div
          key="confirmation"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h3 className="mt-4 text-xl font-black text-gray-900">Slot Reserved!</h3>
          <p className="mt-1 text-sm text-gray-500">{result.message}</p>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Booking ID</span>
              <span className="font-dm-sans font-bold text-[#FF6201]">#{result.bookingId}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-dm-sans font-medium text-gray-900">{date}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-dm-sans font-medium text-gray-900">{formatTime12(slot.time)}</span>
            </div>
            {course && (
              <div className="mt-1 flex justify-between">
                <span className="text-gray-500">Course</span>
                <span className="font-medium text-gray-900">{course}</span>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <a
              href={result.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851]"
            >
              Confirm via WhatsApp
            </a>
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Book Another Slot
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
