// =============================================================================
//  Own-Vehicle — Card 3: booking details, charges and the submit path.
// =============================================================================
// Reads the shared course choices (days / minutes / pick & drop / distance)
// from useOwnVehicleBooking plus the chosen slot owned by the page. Every
// price shown here comes from the pure pricing module — never from arithmetic
// in this file — and the server recomputes the same numbers before it stores
// the booking, so a tampered browser cannot change the amount.
// =============================================================================
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import bookingIcon from "../../assets/booking.svg";
import calendarIcon from "../../assets/calendar.svg";
import car3Icon from "../../assets/car3.svg";
import { useRouter } from "../../router";
import { useCountUp } from "../../hooks/useCountUp";
import { submitSlotBooking } from "../../lib/slotAvailability";
import {
  PICKDROP_RATE_PER_KM,
  ROUND_TRIP_MULTIPLIER,
  formatRs,
} from "../../lib/ownVehiclePricing";
import {
  formatDateShort,
  formatTimeRange,
  lessonRange,
  tilesNeeded,
} from "../../lib/ownVehicleSlots";

// Same rule as the existing booking wizard (src/components/Booking/). Inlined
// rather than imported because that folder is not part of this page.
const PAKISTANI_MOBILE_RE = /^03\d{9}$/;

// ── Small form controls ──────────────────────────────────────────────────────

function SegmentedControl({
  id,
  label,
  options,
  value,
  onChange,
  error,
  required,
}) {
  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-xs font-semibold text-gray-600">
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        className="flex gap-2"
      >
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40 ${
                selected
                  ? "border-[#FF6201] bg-orange-50 text-[#FF6201]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function InstructorPreference({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-gray-600">
        Instructor Preference
      </legend>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {["Female", "Male"].map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700"
          >
            <input
              type="radio"
              name="own-vehicle-instructor"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-[#FF6201]"
            />
            {option}
          </label>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        Preference only. Subject to availability.
      </p>
    </fieldset>
  );
}

// ── Charges panel ────────────────────────────────────────────────────────────

function ChargesPanel({ booking }) {
  const { days, homeService, distanceKm, pricing } = booking;
  const animatedTotal = useCountUp(pricing.total, 500);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Your Charges
      </p>

      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Course Fee</span>
          <span className="font-dm-sans font-semibold text-gray-900">
            {formatRs(pricing.courseFee)}
          </span>
        </div>
        <p className="text-[11px] leading-4 text-gray-400">
          {days} days &times; {formatRs(pricing.perDayPrice)} ={" "}
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
              {days} days &times; {formatRs(PICKDROP_RATE_PER_KM)} &times;{" "}
              {distanceKm} km &times; {ROUND_TRIP_MULTIPLIER} (round trip) ={" "}
              {formatRs(pricing.pickDropCharge)}
            </p>
          </>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between border-t border-gray-200 pt-3">
        <span className="text-base font-extrabold text-gray-900">Total</span>
        <span
          className="font-dm-sans text-3xl font-black leading-none text-gray-900"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatRs(animatedTotal)}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
        Final price is confirmed by our team before your booking is confirmed.
      </p>
    </div>
  );
}

// ── Confirmation summary row ─────────────────────────────────────────────────

function SummaryRow({ label, value }) {
  return (
    <div className="mt-1 flex items-center justify-between gap-3 first:mt-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-dm-sans font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Card 3 ───────────────────────────────────────────────────────────────────

export default function BookingDetails({ booking, slotSelection }) {
  const { navigate } = useRouter();
  const { days, minutes, homeService, distanceKm, address, pricing } = booking;
  const need = tilesNeeded(minutes);

  const selectedDate = slotSelection?.date || "";
  const selectedSlot = slotSelection?.slot || "";
  const selectedLesson = selectedSlot ? lessonRange(selectedSlot, need) : null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [transmission, setTransmission] = useState("Automatic");
  const [instructor, setInstructor] = useState("Female");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your full name.";
    if (!phone.trim()) e.phone = "Please enter your phone number.";
    else if (!PAKISTANI_MOBILE_RE.test(phone.trim()))
      e.phone = "Enter a valid mobile number (03XXXXXXXXX).";
    if (!gender) e.gender = "Please select your gender.";
    if (!adultConfirmed) e.adult = "Please confirm you are 18 or older.";
    // Pick & drop is configured in Card 1, but the booking is only valid once
    // its address and distance are present — fail here if Card 1 was skipped.
    if (homeService) {
      if (!address.trim()) e.address = "Please enter your pickup address.";
      else if (address.trim().length < 5)
        e.address = "Please enter a complete address.";
      if (!distanceKm || distanceKm <= 0) {
        e.distance = "Set your pickup on the map or enter a distance.";
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
        preferred_date: selectedDate,
        preferred_time: selectedSlot,
        course: "Own Vehicle Course",
        distance_km: homeService ? distanceKm : 0,
        home_service: homeService,
        address: homeService ? address.trim() : "",
        area: "",
        extra: {
          booking_type: "own_vehicle",
          course_days: days,
          lesson_minutes: minutes,
          tiles_needed: need,
          transmission,
          gender,
          instructor_preference: instructor,
          adult_confirmed: true,
        },
      });
      setResult(res);
    } catch (err) {
      setSubmitError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(adultConfirmed && selectedSlot) && !submitting;

  return (
    <section
      aria-labelledby="own-vehicle-details-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Card header */}
      <div className="flex items-center gap-3">
        <img src={bookingIcon} alt="" className="h-9 w-9 shrink-0" />
        <div>
          <h2
            id="own-vehicle-details-heading"
            className="text-lg font-extrabold text-gray-900"
          >
            Booking Details
          </h2>
          <p className="text-xs text-gray-500">
            Confirm your details and request this course.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            {/* Chosen slot summary */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              {selectedLesson ? (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <img
                      src={calendarIcon}
                      alt=""
                      className="h-4 w-4"
                    />
                    <span className="font-dm-sans font-semibold text-gray-900">
                      {formatDateShort(selectedDate)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} className="text-gray-900" />
                    <span className="font-dm-sans font-semibold text-gray-900">
                      {formatTimeRange(selectedLesson.start, selectedLesson.end)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <img
                      src={car3Icon}
                      alt=""
                      className="h-4 w-4"
                    />
                    <span className="font-dm-sans font-semibold text-gray-900">
                      {days} days
                    </span>
                    <span className="text-gray-400">&middot;</span>
                    <span className="font-dm-sans font-semibold text-gray-900">
                      {minutes} min daily
                    </span>
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0 text-amber-500"
                  />
                  <span>
                    No slot chosen yet. Pick a date and time in{" "}
                    <span className="font-semibold">Choose Your Slot</span>{" "}
                    above, then come back here to finish.
                  </span>
                </p>
              )}
            </div>

            {/* Pick & drop is configured in Card 1, so a visitor who skipped it
                needs a pointer back rather than a silent submit failure. */}
            {homeService && (!address.trim() || !distanceKm || distanceKm <= 0) && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertTriangle
                  size={15}
                  className="mt-0.5 shrink-0 text-amber-500"
                />
                <span>
                  Your pick &amp; drop setup is incomplete — add your pickup
                  address and distance in{" "}
                  <span className="font-semibold">Build Your Course</span>{" "}
                  above.
                </span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5" noValidate>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
                {/* ── Form fields. On phones the charges sit above the form. ── */}
                <div className="order-2 space-y-5 lg:order-1">
                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="own-vehicle-name"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"
                      >
                        <User size={12} />
                        <span>
                          Full Name
                          <span className="text-red-500" aria-hidden="true">
                            *
                          </span>
                        </span>
                      </label>
                      <input
                        id="own-vehicle-name"
                        type="text"
                        autoComplete="name"
                        aria-required="true"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ali Hassan"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? "own-vehicle-name-error" : undefined
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                          errors.name
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                        }`}
                      />
                      {errors.name && (
                        <p
                          id="own-vehicle-name-error"
                          className="mt-1 text-xs text-red-500"
                        >
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="own-vehicle-phone"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"
                      >
                        <Phone size={12} />
                        <span>
                          Phone Number
                          <span className="text-red-500" aria-hidden="true">
                            *
                          </span>
                        </span>
                      </label>
                      <input
                        id="own-vehicle-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="numeric"
                        aria-required="true"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03001234567"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? "own-vehicle-phone-error" : undefined
                        }
                        className={`font-dm-sans w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                          errors.phone
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                        }`}
                      />
                      {errors.phone && (
                        <p
                          id="own-vehicle-phone-error"
                          className="mt-1 text-xs text-red-500"
                        >
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <SegmentedControl
                    id="own-vehicle-gender"
                    label="Gender"
                    options={["Male", "Female"]}
                    value={gender}
                    onChange={setGender}
                    error={errors.gender}
                    required
                  />

                  {/* Transmission */}
                  <SegmentedControl
                    id="own-vehicle-transmission"
                    label="Your car's transmission"
                    options={["Automatic", "Manual"]}
                    value={transmission}
                    onChange={setTransmission}
                  />

                  {/* Instructor preference */}
                  <InstructorPreference value={instructor} onChange={setInstructor} />

                  {/* 18+ confirmation */}
                  <div>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={adultConfirmed}
                        onChange={(e) => setAdultConfirmed(e.target.checked)}
                        aria-required="true"
                        aria-invalid={Boolean(errors.adult)}
                        aria-describedby={
                          errors.adult ? "own-vehicle-adult-error" : undefined
                        }
                        className="mt-0.5 h-4 w-4 rounded accent-[#FF6201]"
                      />
                      <span className="text-sm text-gray-700">
                        I am 18 or older.
                        <span className="text-red-500" aria-hidden="true">
                          *
                        </span>
                      </span>
                    </label>
                    {errors.adult && (
                      <p
                        id="own-vehicle-adult-error"
                        className="mt-1 text-xs text-red-500"
                      >
                        {errors.adult}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Charges — above the form on phones, sticky beside it on
                    desktop. ── */}
                <div className="order-1 lg:order-2">
                  <div className="lg:sticky lg:top-6">
                    <ChargesPanel booking={booking} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              {submitError && (
                <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="mt-5 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  title={
                    !selectedSlot
                      ? "Choose a slot above first"
                      : !adultConfirmed
                        ? "Please confirm you are 18 or older"
                        : "Request this booking"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-900"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Sending request…
                    </>
                  ) : (
                    "Request Booking"
                  )}
                </button>

                <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] leading-4 text-gray-400">
                  <ShieldCheck size={12} className="mt-0.5 shrink-0" />
                  <span>
                    Your details are used only to arrange this booking. Read our{" "}
                    <a
                      href="/privacy-policy/"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/privacy-policy/");
                      }}
                      className="font-semibold text-gray-500 underline transition hover:text-[#FF6201]"
                    >
                      privacy policy
                    </a>
                    .
                  </span>
                </p>
              </div>
            </form>
          </motion.div>
        ) : (
          /* ── Confirmation ── */
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-5 max-w-md text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-black text-gray-900">
              Booking Requested!
            </h3>
            <p className="mt-1 text-sm text-gray-500">{result.message}</p>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-sm">
              <SummaryRow
                label="Booking ID"
                value={`#${result.bookingId}`}
              />
              <SummaryRow
                label="Date"
                value={formatDateShort(selectedDate)}
              />
              <SummaryRow
                label="Time"
                value={
                  selectedLesson
                    ? formatTimeRange(selectedLesson.start, selectedLesson.end)
                    : selectedSlot
                }
              />
              <SummaryRow label="Course" value="Own Vehicle Course" />
              <SummaryRow label="Duration" value={`${days} days`} />
              <SummaryRow label="Daily Lesson" value={`${minutes} min`} />
              <SummaryRow label="Total" value={formatRs(pricing.total)} />
            </div>

            <div className="mt-5 space-y-2">
              <a
                href={result.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
              >
                Confirm via WhatsApp
              </a>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
              >
                <ArrowLeft size={14} />
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
