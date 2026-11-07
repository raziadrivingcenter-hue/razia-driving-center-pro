import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  AlertTriangle,
  CarFront,
  Users,
  CheckCircle2,
  Sunrise,
  Sun,
  Sunset,
  CalendarOff,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "../../router";
import slotBg from "../../assets/slot-page-bg.png";
import couponIcon from "../../assets/coupon.svg";
import travelIcon from "../../assets/travel.svg";
import femaleDrivingIcon from "../../assets/femaledriving.svg";

import { fetchAvailability } from "../../lib/slotAvailability";
import { useMeta } from "../../useMeta";
import BookingForm from "./BookingForm";
import AreaSelect from "./AreaSelect";
import { computeSlotStatus, normalizeArea } from "./slotStatusLogic";
import "./slot-tokens.css";

// 24 half-hour slots from 07:00 to 19:00 (start times)
const SLOT_STARTS = Array.from({ length: 24 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function timeToMin(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatTime12(timeStr) {
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

// Shared wording for a relative day count: 0 → "Today", 1 → "Tomorrow",
// otherwise "in N days". Used by the booked tile's date label and by the
// advance tile's "available again" label so both read identically.
function daysWordLabel(diff) {
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}

// "Today" / "Tomorrow" / "in N days"
function daysLeftLabel(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return daysWordLabel(diff);
}

// Advance tile's second label. Uses the same wording helper as
// daysLeftLabel so N=1 reads "Tomorrow" (never "Available in 1 days"), and
// reads "Available in N days" otherwise. Returns null when the count is
// unknown (older rows without available_in_days) so only the first label
// renders.
function availableInDaysLabel(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
  const days = Number(n);
  if (days === 1) return daysWordLabel(days);
  return `Available in ${days} days`;
}

// Split the day into three display periods.
const PERIODS = [
  { key: "morning", label: "Morning", icon: Sunrise, range: [7 * 60, 12 * 60] },
  { key: "afternoon", label: "Afternoon", icon: Sun, range: [12 * 60, 17 * 60] },
  { key: "evening", label: "Evening", icon: Sunset, range: [17 * 60, 19 * 60] },
];

export default function SlotAvailability() {
  const { navigate } = useRouter();

  // Route-specific meta so crawlers / AI engines see a proper title + description
  // for the public slot-booking page.
  useMeta({
    title: "Book Your Slot | Razia Driving Center",
    description:
      "Pick a date and claim an available 30-minute driving lesson slot with Razia Driving Center, Lahore. 7 AM – 7 PM, one-to-one training.",
    canonical: "https://raziadrivingcenter.com/slot-availability/",
  });

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedArea, setSelectedArea] = useState(""); // visitor's town for area discount
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null); // { time }
  // Shared-element zoom: set while the clicked tile flies into the booking
  // card. { slot, label, rect, target } — rect/target are viewport coords.
  const [zoom, setZoom] = useState(null);
  const contentRef = useRef(null);
  const zoomTimers = useRef([]);

  // Identity prefill handed off from the authenticated student dashboard.
  // The dashboard stashes { name, accessToken } in sessionStorage (verified
  // Google profile name + Supabase session JWT) before navigating here. The
  // token proves identity server-side; the email is derived from the verified
  // Auth user and is NEVER exposed as an editable field. Public visitors have
  // no entry here and the form stays blank (email column stays NULL).
  // Read once on mount, then clear it so it can't leak into a later booking.
  const [prefill] = useState(() => {
    try {
      const raw = sessionStorage.getItem("rdc_dashboard_prefill");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (prefill) sessionStorage.removeItem("rdc_dashboard_prefill");
  }, [prefill]);

  // Cancel any in-flight zoom timers if the page unmounts mid-transition.
  useEffect(() => {
    const timers = zoomTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Compute once on mount (lazy init) — avoids impure Date.now() during render.
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  // Clear the date + fetched data (used by "Pick a Different Date" on Sunday).
  const handleResetDate = () => {
    setSelectedDate("");
    setData(null);
    setError("");
  };

  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setBookingSlot(null);
    setSelectedArea(""); // date changed → area options may differ

    fetchAvailability(selectedDate)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load availability.");
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Effective area for matching: "" and the "Other" sentinel both mean
  // "no town selected" → no promo/travel-area match can apply.
  const effectiveArea =
    selectedArea === "" || selectedArea === "__other__" ? "" : selectedArea;

  // Distinct, non-null towns the visitor can pick from: every promo_area on an
  // available tile and every area on a travel tile, de-duplicated and sorted,
  // with "Other" appended as the no-discount catch-all.
  const areaOptions = useMemo(() => {
    if (!data) return [];
    const towns = new Set();
    for (const s of data.availableSlots || []) if (s.promoArea) towns.add(s.promoArea);
    for (const s of data.travelSlots || []) if (s.area) towns.add(s.area);
    return [...towns].sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Aggregate per time-slot across all vehicles. The pure rules live in
  // slotStatusLogic.js (unit-tested); this memo just feeds it the current data
  // and the visitor's effective area.
  const slotStatus = useMemo(
    () =>
      computeSlotStatus({
        data,
        effectiveArea,
        slotStarts: SLOT_STARTS,
        timeToMin,
      }),
    [data, effectiveArea]
  );

  // Group slots by period for the 3-column layout.
  const periods = useMemo(
    () =>
      PERIODS.map((p) => ({
        ...p,
        slots: SLOT_STARTS.filter(
          (s) => timeToMin(s) >= p.range[0] && timeToMin(s) < p.range[1]
        ),
      })),
    []
  );

  const vehicles = data?.vehicles || [];
  const synced = data?.synced ?? false;

  // Count per-cell statuses from slotStatus so the stats bar reflects what the
  // grid actually shows. Area-specific travel tiles count as available (they
  // are bookable); advance tiles count as booked (never as available); plain
  // travel cells are counted separately.
  const slotCounts = useMemo(
    () => {
      const vals = Object.values(slotStatus);
      return {
        available: vals.filter(
          (e) => e.status === "available" || e.status === "area-available"
        ).length,
        booked: vals.filter(
          (e) => e.status === "booked" || e.status === "advance"
        ).length,
        travel: vals.filter((e) => e.status === "travel").length,
      };
    },
    [slotStatus]
  );

  // Sunday = weekly off. Still bookable on request (WhatsApp / special slot).
  const isSunday = useMemo(() => {
    if (!selectedDate) return false;
    return new Date(selectedDate + "T00:00:00").getDay() === 0;
  }, [selectedDate]);

  // Click → every other tile collapses with a staggered ripple while the
  // clicked tile "zooms out" into a ghost card that expands into the booking
  // form. The ghost is a fixed-position clone, so the grid can unmount as the
  // form mounts without the flight being cut short.
  const handleSlotClick = (slot, e) => {
    const entry = slotStatus[slot];
    if (entry?.status !== "available" && entry?.status !== "area-available") return;

    const payload = {
      time: slot,
      promoPercent: entry.promoPercent || null,
      promoArea: entry.promoArea || null,
      area: entry.area || null,
      blockReason: entry.blockReason || null,
      vehicleId: entry.vehicleId || null,
      vehicleName: entry.vehicleName || null,
    };

    // Respect reduced-motion: swap instantly, no flight.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBookingSlot(payload);
      return;
    }

    // A second click mid-flight restarts the transition cleanly. Mutate the
    // array in place — the unmount cleanup captured its reference.
    zoomTimers.current.forEach((t) => clearTimeout(t));
    zoomTimers.current.length = 0;

    const rect = e.currentTarget.getBoundingClientRect();

    // Flight target = the booking card: centred, max-w-2xl (672px), at the top
    // of the content column.
    const c = contentRef.current?.getBoundingClientRect();
    const targetWidth = c
      ? Math.min(c.width, 672)
      : Math.min(window.innerWidth - 32, 672);

    setZoom({
      slot,
      label: formatTime12(slot),
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      target: {
        top: c ? c.top : window.innerHeight * 0.2,
        left: c
          ? c.left + (c.width - targetWidth) / 2
          : (window.innerWidth - targetWidth) / 2,
        width: targetWidth,
        height: 560,
      },
    });

    // Swap to the booking card once the tile has expanded into place, then
    // drop the ghost after its fade finishes.
    zoomTimers.current.push(window.setTimeout(() => setBookingSlot(payload), 400));
    zoomTimers.current.push(window.setTimeout(() => setZoom(null), 640));
  };

  return (
    <div
      className={`rdc-booking min-h-screen bg-gray-50 pb-16 relative overflow-hidden ${
        bookingSlot ? "pt-10 lg:flex lg:flex-col lg:pt-0" : "pt-24"
      }`}
    >
      {/* Pinned to the viewport so the map stays put while the cards scroll
          over it. `absolute` would make the artwork travel with the page. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${slotBg})` }}
      />
      <div
        className={`relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 ${
          bookingSlot
            ? "lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:py-10"
            : ""
        }`}
      >
        {/* Hero — back link, title, subtitle and date picker. All of it steps
            aside once the booking wizard is open; the wizard carries its own
            "Back to slots" control, so the page chrome would only duplicate it. */}
        {!bookingSlot && (
          <>
            {/* Back to home */}
            <button
              onClick={() => navigate("/")}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-[#FF6201]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>

            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                Book Your Slot
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                Pick a date and claim an available training slot. 30-minute blocks, 7 AM – 7
                PM.
              </p>
            </div>

            {/* Date picker */}
            <div className="mx-auto mt-6 max-w-xs">
              <label className="mb-1.5 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600">
                <CalendarDays size={14} className="text-[#FF6201]" />
                Select Date
              </label>
              <input
                type="date"
                min={today}
                max={maxDate}
                value={selectedDate}
                onChange={handleDateChange}
                className="font-dm-sans w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-[#FF6201] focus:ring-4 focus:ring-[#FF6201]/10"
              />
            </div>
          </>
        )}

        {/* Content */}
        <div className="mt-8" ref={contentRef}>
          {!selectedDate ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Clock3 size={40} className="mb-3 text-gray-300" />
              <p className="text-sm">Choose a date above to view available slots.</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <LoaderCircle size={32} className="mb-3 animate-spin text-[#FF6201]" />
              <p className="text-sm">Loading schedule...</p>
            </div>
          ) : error ? (
            <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !synced ? (
            <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Schedule for this date hasn&apos;t synced yet. Pick another date or WhatsApp us at{" "}
                <a href="https://wa.me/923094461407" className="font-semibold underline">
                  +92 309 4461407
                </a>
                .
              </span>
            </div>
          ) : isSunday ? (
            /* ── Sunday (weekly off) ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <CalendarOff size={28} className="text-[#FF6201]" />
              </div>
              <h3 className="mt-4 text-lg font-black text-gray-900">Sunday — Weekly Off</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                We are closed on Sundays, so no regular slots are shown. However,
                we understand your schedule may require a Sunday lesson &mdash;
                <span className="font-semibold text-gray-700">we can still arrange one for you on request!</span>
              </p>
              <div className="mt-5 space-y-2">
                <a
                  href={`https://wa.me/923094461407?text=${encodeURIComponent(
                    `Hello Razia Driving Center,\n\nI would like to book a lesson on Sunday (${selectedDate}). Please arrange a slot for me.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851]"
                >
                  Request Sunday Slot on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="w-full rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Pick a Different Date
                </button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {!bookingSlot ? (
                /* ── Slot grid ── */
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  {/* Stats bar */}
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-xs font-medium text-gray-700">
                        <span className="font-dm-sans font-semibold">{slotCounts.available}</span> available
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <Users size={14} className="text-red-400" />
                      <span className="text-xs font-medium text-gray-700">
                        <span className="font-dm-sans font-semibold">{slotCounts.booked}</span> booked
                      </span>
                    </div>
                    {slotCounts.travel > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                        <CarFront size={14} className="text-yellow-500" />
                        <span className="text-xs font-medium text-gray-700">
                          <span className="font-dm-sans font-semibold">{slotCounts.travel}</span> traveling
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <CarFront size={14} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">
                        <span className="font-dm-sans font-semibold">{vehicles.length}</span> vehicle{vehicles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Area discount picker — only shown when promos/travel towns exist */}
                  {areaOptions.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <AreaSelect
                        label="Your area"
                        value={selectedArea}
                        onChange={setSelectedArea}
                        options={areaOptions}
                      />
                      {effectiveArea && (
                        <span className="text-[11px] font-medium text-green-600">
                          Promo applies when slot matches <strong>{effectiveArea}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3-column periods */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {periods.map((period) => {
                      const PeriodIcon = period.icon;
                      return (
                        <div
                          key={period.key}
                          className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <PeriodIcon size={16} className="text-[#FF6201]" />
                            <span className="text-sm font-bold text-gray-800">
                              {period.label}
                            </span>
                            <span className="ml-auto font-dm-sans text-[10px] font-medium text-gray-400">
                              {period.range[0] / 60}:00–{period.range[1] / 60}:00
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {period.slots.map((slot) => {
                              const entry = slotStatus[slot];
                              const label = formatTime12(slot);
                              const isZoomSource = zoom?.slot === slot;
                              // Ripple delay: tiles nearer the clicked one
                              // collapse first, so the grid appears to fold
                              // away from the selection.
                              const collapseDelay = zoom
                                ? Math.min(
                                    Math.abs(
                                      SLOT_STARTS.indexOf(slot) -
                                        SLOT_STARTS.indexOf(zoom.slot)
                                    ) * 20,
                                    200
                                  )
                                : 0;

                              let cell;

                              if (entry.status === "available") {
                                // Promo badge only when selected area matches the
                                // slot's promo_area (normalized). Otherwise hint
                                // the visitor to pick their area to claim it.
                                const promoMatch =
                                  entry.promoPercent &&
                                  entry.promoArea &&
                                  normalizeArea(effectiveArea) === normalizeArea(entry.promoArea);
                                const showPromoHint =
                                  entry.promoPercent && entry.promoArea && !promoMatch;

                                cell = (
                                  <motion.button
                                    key={slot}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => handleSlotClick(slot, e)}
                                    className="flex flex-col gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left transition hover:border-green-300 hover:bg-green-100"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span
                                        className="font-dm-sans text-sm font-semibold text-green-700 truncate"
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                      <span className="shrink-0 rounded-full bg-green-200/60 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                        Book
                                      </span>
                                    </div>
                                    {promoMatch && (
                                      <span
                                        className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700"
                                        title={`${entry.promoPercent}% off pick & drop in ${entry.promoArea}`}
                                      >
                                        {entry.promoPercent}% off · {entry.promoArea}
                                      </span>
                                    )}
                                    {showPromoHint && (
                                      <span className="text-[10px] font-medium text-gray-400">
                                        Select your area to claim
                                      </span>
                                    )}
                                  </motion.button>
                                );
                              } else if (entry.status === "booked") {
                                cell = (
                                  <div
                                    key={slot}
                                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span
                                        className="font-dm-sans text-sm font-medium text-red-700 truncate"
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                      <span className="font-dm-sans shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                                        {daysLeftLabel(selectedDate)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else if (entry.status === "advance") {
                                // Advance-booked tile: light gray, disabled (never
                                // clickable), gray time text. Two labels — the red
                                // "Booked In Advance" and, when the row carries
                                // available_in_days, a second small label using the
                                // shared day wording ("Tomorrow" / "Available in N
                                // days").
                                const advanceLabel = availableInDaysLabel(
                                  entry.availableInDays
                                );
                                cell = (
                                  <div
                                    key={slot}
                                    aria-disabled="true"
                                    className="advance-slot cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className="font-dm-sans text-sm font-medium text-gray-500 truncate"
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                      <span className="font-dm-sans shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                                        {daysLeftLabel(selectedDate)}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 flex flex-col gap-0.5">
                                      <span className="text-[10px] font-semibold text-red-600">
                                        Booked In Advance
                                      </span>
                                      {advanceLabel && (
                                        <span className="text-[10px] font-medium text-gray-500">
                                          {advanceLabel}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              } else if (entry.status === "area-available") {
                                const areaLabel = entry.area || effectiveArea;
                                cell = (
                                  <motion.button
                                    key={slot}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => handleSlotClick(slot, e)}
                                    className="area-travel-slot"
                                    title={`Available for ${areaLabel}`}
                                  >
                                    <span
                                      className="area-travel-slot__stars"
                                      aria-hidden="true"
                                    />
                                    <span
                                      className="area-travel-slot__gifts"
                                      aria-hidden="true"
                                    >
                                      <img
                                        src={couponIcon}
                                        width="20"
                                        height="20"
                                        alt=""
                                      />
                                    </span>
                                    <span
                                      className="area-travel-slot__sheen"
                                      aria-hidden="true"
                                    />
                                    <span className="relative z-10 flex items-center justify-between gap-2">
                                      <span
                                        className="font-dm-sans text-sm font-semibold text-white truncate"
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                      <span className="flex shrink-0 items-center gap-1">
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                                          Book
                                        </span>
                                      </span>
                                    </span>
                                    <span className="relative z-10 mt-0.5 inline-flex w-fit items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                      Available for {areaLabel}
                                    </span>
                                    {entry.promoPercent &&
                                      entry.promoArea &&
                                      normalizeArea(effectiveArea) ===
                                        normalizeArea(entry.promoArea) && (
                                        <span className="relative z-10 mt-0.5 inline-flex w-fit items-center rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">
                                          {entry.promoPercent}% off pick &amp; drop
                                        </span>
                                      )}
                                  </motion.button>
                                );
                              } else if (entry.status === "travel") {
                                const travelLabel = entry.area
                                  ? `Traveling to ${entry.area}`
                                  : "Traveling";
                                cell = (
                                  <div
                                    key={slot}
                                    className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2"
                                    title={travelLabel}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className="font-dm-sans text-sm font-medium text-yellow-700 truncate"
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                      <span
                                        className="flex shrink-0 items-center gap-1 rounded-full bg-yellow-200/70 px-2 py-0.5 text-[10px] font-bold text-yellow-700"
                                        title={travelLabel}
                                      >
                                        <img
                                          src={travelIcon}
                                          width="12"
                                          height="12"
                                          alt=""
                                          className="shrink-0"
                                        />
                                        <span className="truncate">{travelLabel}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else {
                                // empty — vehicle not operating
                                cell = (
                                  <div
                                    key={slot}
                                    className="rounded-lg bg-gray-50 px-3 py-2 font-dm-sans text-sm text-gray-300"
                                  >
                                    {label}
                                    <span className="ml-1 text-xs">—</span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={slot}
                                  className={[
                                    "slot-cell",
                                    zoom ? "is-collapsing" : "",
                                    isZoomSource ? "is-zoom-source" : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  style={
                                    zoom && !isZoomSource
                                      ? { transitionDelay: `${collapseDelay}ms` }
                                      : undefined
                                  }
                                >
                                  {cell}
                                </div>
                              );
                            })}
                          </div>

                          {/* Evening runs 17:00–19:00, so this column is shorter
                              than the other two and leaves a gap at the bottom.
                              Fill it with the instructor artwork, a line of
                              context and a WhatsApp call-to-action. `flex-1`
                              only stretches on desktop, where the grid row is
                              equal-height; on mobile it wraps to content. */}
                          {period.key === "evening" && (
                            <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-orange-200 bg-orange-50/70 px-4 py-5 text-center">
                              <img
                                src={femaleDrivingIcon}
                                width="80"
                                height="80"
                                alt=""
                                className="h-20 w-20 object-contain"
                              />
                              <p className="text-xs font-semibold text-gray-700">
                                Evening slots are limited and fill up fast —
                                reserve yours before they&apos;re gone.
                              </p>
                              <a
                                href={`https://wa.me/923094461407?text=${encodeURIComponent(
                                  "Hello Razia Driving Center,\n\nI would like to arrange my evening slot according to my needs. Please help me book a suitable time."
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1da851]"
                              >
                                <MessageCircle size={14} />
                                Message us to arrange your Slot according to your need
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-center text-xs text-gray-400">
                    Tap a{" "}
                    <span className="font-semibold text-green-600">green slot</span> to book it.
                  </p>
                </motion.div>
              ) : (
                /* ── Inline registration form ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <BookingForm
                    slot={bookingSlot}
                    date={selectedDate}
                    area={effectiveArea}
                    promoPercent={bookingSlot.promoPercent}
                    promoArea={bookingSlot.promoArea}
                    onBack={() => setBookingSlot(null)}
                    prefill={prefill}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Shared-element zoom — the clicked tile flies into the booking card.
          Portaled to <body> so the page's overflow-hidden never clips it. */}
      {zoom &&
        createPortal(
          <motion.div
            className="area-travel-slot area-travel-slot--ghost"
            initial={{
              position: "fixed",
              zIndex: 60,
              top: zoom.rect.top,
              left: zoom.rect.left,
              width: zoom.rect.width,
              height: zoom.rect.height,
              borderRadius: 12,
              opacity: 1,
            }}
            animate={{
              top: zoom.target.top,
              left: zoom.target.left,
              width: zoom.target.width,
              height: zoom.target.height,
              borderRadius: 16,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.6, times: [0, 0.65, 1], ease: "linear" },
            }}
          >
            <span className="area-travel-slot__stars" aria-hidden="true" />
            <span className="relative z-10 flex h-full items-center justify-center gap-2">
              <span className="font-dm-sans text-lg font-bold text-white">
                {zoom.label}
              </span>
              <span className="text-xs font-semibold text-white/85">
                Opening booking…
              </span>
            </span>
          </motion.div>,
          document.body
        )}
    </div>
  );
}
