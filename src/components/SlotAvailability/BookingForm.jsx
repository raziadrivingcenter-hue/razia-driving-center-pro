import { useState, useMemo } from "react";
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
function CourseSelect({ value, onChange, error }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gray-600">Select Course</p>
      <div className="grid grid-cols-3 gap-2">
        {courses.map((c) => {
          const selected = value === c.title;
          return (
            <button
              type="button"
              key={c.name}
              onClick={() => onChange(c.title)}
              className={`
                rounded-lg border px-2 py-2 text-center transition
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
              <span className="block text-[10px] font-medium text-gray-400">
                {c.price}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const wantsPickDrop = pickup === "Yes";
  const distanceNum = Number(distance) || 0;

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
      if (!distanceNum || distanceNum <= 0) e.distance = "Enter distance";
      else if (distanceNum > 20) e.distance = "Pick & Drop is available up to 20 KM";
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
          className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {/* Back + slot summary */}
          <div className="flex items-center justify-between">
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

          <h3 className="mt-4 text-lg font-black text-gray-900">Complete Your Booking</h3>
          <p className="text-xs text-gray-500">Fill in your details to reserve this slot.</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                    onClick={() => setPickup(opt)}
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

              <AnimatePresence>
                {wantsPickDrop && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3">
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
                          {errors.distance && (
                            <p className="mt-1 text-xs text-red-500">{errors.distance}</p>
                          )}
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

            {/* Pricing preview */}
            {pricing && pricing.courseFee > 0 && (() => {
              // Effective per-km rate across the whole course (rate × days × round
              // trip) — taken straight from the calculator, not recomputed here.
              const perKmRate = pricing.effectiveRatePerKm;
              const withinFree =
                pricing.freeKm > 0 && pricing.distanceKm <= pricing.freeKm;
              const totalPayable =
                pricing.courseFee + pricing.pickDropCharges - discount;

              return (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  {/* 1) Course Fee */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Course Fee</span>
                    <span className="font-dm-sans font-semibold text-gray-800">
                      Rs. {pricing.courseFee.toLocaleString()}
                    </span>
                  </div>

                  {/* 2) Pick & Drop + calculation */}
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Pick & Drop</span>
                    <span className="font-dm-sans font-semibold text-gray-800">
                      Rs. {pricing.pickDropCharges.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
                    {withinFree ? (
                      "Within free distance"
                    ) : pricing.freeKm > 0 ? (
                      <>
                        {pricing.distanceKm} km &minus; {pricing.freeKm} km free ={" "}
                        {pricing.chargeableKm} km &times; Rs.{" "}
                        {perKmRate.toLocaleString()}
                      </>
                    ) : (
                      <>
                        {pricing.distanceKm} km &times; Rs.{" "}
                        {perKmRate.toLocaleString()}
                      </>
                    )}
                  </p>

                  {/* 3) Area discount — only when tile promo matches selected area */}
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
                        {promoPercent}% of Rs.{" "}
                        {pricing.pickDropCharges.toLocaleString()} = Rs.{" "}
                        {discount.toLocaleString()}
                      </p>
                    </>
                  )}

                  {/* 4) Total Payable */}
                  <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="text-sm font-bold text-gray-900">Total Payable</span>
                    <span className="font-dm-sans text-sm font-black text-[#FF6201]">
                      Rs. {totalPayable.toLocaleString()}
                    </span>
                  </div>

                  {/* 5) Confirmation note */}
                  <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
                    Final price confirmed by our team before booking confirmation.
                  </p>
                </div>
              );
            })()}

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          </form>
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
