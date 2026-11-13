import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarOff,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Sun,
  Sunrise,
  Sunset,
  Users,
} from "lucide-react";

import calendarIcon from "../../assets/calendar.svg";
import car3Icon from "../../assets/car3.svg";
import { fetchOwnVehicleAvailability } from "../../lib/ownVehicleAvailability";
import {
  SLOT_STARTS,
  formatDateShort,
  formatTimeRange,
  isSelectableStart,
  lessonRange,
  rangeSlots,
  slotsByPeriod,
  tilesNeeded,
  timeToMin,
} from "../../lib/ownVehicleSlots";
import { computeSlotStatus } from "../SlotAvailability/slotStatusLogic";
import SlotTile from "./SlotTile";

const PERIOD_ICONS = { morning: Sunrise, afternoon: Sun, evening: Sunset };

// Local (not UTC) YYYY-MM-DD — the date picker must show the visitor's today.
const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const sundayWhatsApp = (date) =>
  `https://wa.me/923094461407?text=${encodeURIComponent(
    `Hello Razia Driving Center,\n\nI would like to book a lesson on Sunday (${date}). Please arrange a slot for me.`
  )}`;

// Card 2 — slot picker. Reuses the /slot-availability data path
// (fetchAvailability) and status logic (computeSlotStatus), with the added
// lesson-length rule: a lesson occupies ceil(minutes / 30) consecutive tiles.
// `selection` ({ date, slot }) is owned by the page so Card 3 reads the exact
// same choice; `onChange` is the page's state setter.
export default function SlotPicker({ booking, onContinue, selection, onChange }) {
  const { minutes, days } = booking;
  const need = tilesNeeded(minutes);

  const [today] = useState(() => toDateString(new Date()));
  const [maxDate] = useState(() =>
    toDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );

  const selectedDate = selection?.date || "";
  const selectedSlot = selection?.slot || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Remember that the lesson length changed so the selection can be re-checked.
  // Adjusted during render — the React-recommended pattern for own state.
  const [prevNeed, setPrevNeed] = useState(need);
  const [needReset, setNeedReset] = useState(false);
  if (prevNeed !== need) {
    setPrevNeed(need);
    setNeedReset(true);
  }

  // Load availability for the chosen date (same endpoint as /slot-availability,
  // plus the DEV ?demo=1 mock inside fetchOwnVehicleAvailability).
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    fetchOwnVehicleAvailability(selectedDate)
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

  // No area field on this page, so travel tiles stay "travel" (never selectable)
  // and no promo/discount can apply.
  const statusBySlot = useMemo(
    () =>
      computeSlotStatus({
        data,
        effectiveArea: "",
        slotStarts: SLOT_STARTS,
        timeToMin,
      }),
    [data]
  );

  // Changing the lesson length re-evaluates the selected range live. If the new
  // length no longer fits, clear the selection and tell the visitor why. The
  // selection belongs to the page, so it can only be cleared from an effect
  // (never during render, which would update a parent mid-render).
  useEffect(() => {
    if (!needReset) return;
    if (selectedSlot && !isSelectableStart(selectedSlot, statusBySlot, need)) {
      onChange((prev) => ({ ...prev, slot: "" }));
    }
  }, [needReset, selectedSlot, statusBySlot, need, onChange]);

  // Derived hint — clears itself as soon as a new slot is chosen.
  const showNeedNotice = needReset && !selectedSlot;

  const periods = useMemo(() => slotsByPeriod(), []);

  const counts = useMemo(() => {
    const values = Object.values(statusBySlot);
    return {
      available: values.filter((e) => e.status === "available").length,
      booked: values.filter(
        (e) => e.status === "booked" || e.status === "advance"
      ).length,
      travel: values.filter((e) => e.status === "travel").length,
    };
  }, [statusBySlot]);

  const isSunday = useMemo(() => {
    if (!selectedDate) return false;
    return new Date(`${selectedDate}T00:00:00`).getDay() === 0;
  }, [selectedDate]);

  const selectedRange = selectedSlot ? rangeSlots(selectedSlot, need) : [];
  const selectedLesson = selectedSlot ? lessonRange(selectedSlot, need) : null;

  const handleDateChange = (e) => {
    onChange({ date: e.target.value, slot: "" });
    setNeedReset(false);
  };

  const handleResetDate = () => {
    onChange({ date: "", slot: "" });
    setData(null);
    setError("");
    setNeedReset(false);
  };

  const handleSelect = (slot) => {
    if (!isSelectableStart(slot, statusBySlot, need)) return;
    onChange((prev) => ({
      ...prev,
      slot: prev.slot === slot ? "" : slot,
    }));
    setNeedReset(false);
  };

  return (
    <section
      aria-labelledby="own-vehicle-slots-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Card header */}
      <div className="flex items-center gap-3">
        <img src={calendarIcon} alt="" className="h-9 w-9 shrink-0" />
        <div>
          <h2
            id="own-vehicle-slots-heading"
            className="text-lg font-extrabold text-gray-900"
          >
            Choose Your Slot
          </h2>
          <p className="text-xs text-gray-500">
            {minutes} min lesson = {need} slot{need > 1 ? "s" : ""} (30 min each).
          </p>
        </div>
      </div>

      {/* Date picker — today onward, 30-day window (same rules as the
          /slot-availability page). */}
      <div className="mx-auto mt-4 max-w-xs">
        <label
          htmlFor="own-vehicle-date"
          className="mb-1.5 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600"
        >
          <img src={calendarIcon} alt="" className="h-4 w-4" />
          <span>
            Select Date
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </span>
        </label>
        <input
          id="own-vehicle-date"
          type="date"
          aria-required="true"
          min={today}
          max={maxDate}
          value={selectedDate}
          onChange={handleDateChange}
          className="font-dm-sans w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-[#FF6201] focus:ring-4 focus:ring-[#FF6201]/10"
        />
      </div>

      <div className="mt-5">
        {!selectedDate ? (
          <div className="flex flex-col items-center py-10 text-gray-400">
            <Clock3 size={36} className="mb-2 text-gray-900" />
            <p className="text-sm">Choose a date above to view available slots.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-10 text-gray-400">
            <LoaderCircle size={28} className="mb-2 animate-spin text-gray-900" />
            <p className="text-sm">Loading schedule...</p>
          </div>
        ) : error ? (
          <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : isSunday ? (
          /* Sunday = weekly off, same handling as /slot-availability. */
          <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
            <CalendarOff size={32} className="text-gray-900" />
            <h3 className="mt-4 text-lg font-black text-gray-900">
              Sunday — Weekly Off
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              We are closed on Sundays, so no regular slots are shown. However,
              we can still arrange one for you on request!
            </p>
            <div className="mt-5 space-y-2">
              <a
                href={sundayWhatsApp(selectedDate)}
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
          </div>
        ) : !data?.synced ? (
          <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Schedule for this date hasn&apos;t synced yet. Pick another date or
              WhatsApp us at{" "}
              <a
                href="https://wa.me/923094461407"
                className="font-semibold underline"
              >
                +92 309 4461407
              </a>
              .
            </span>
          </div>
        ) : (
          <>
            {/* Status counters — same meanings as /slot-availability. */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs font-medium text-gray-700">
                  <span className="font-dm-sans font-semibold">
                    {counts.available}
                  </span>{" "}
                  available
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100">
                <Users size={14} className="text-red-400" />
                <span className="text-xs font-medium text-gray-700">
                  <span className="font-dm-sans font-semibold">
                    {counts.booked}
                  </span>{" "}
                  booked
                </span>
              </div>
              {counts.travel > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100">
                  <img
                    src={car3Icon}
                    alt=""
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    <span className="font-dm-sans font-semibold">
                      {counts.travel}
                    </span>{" "}
                    traveling
                  </span>
                </div>
              )}
            </div>

            {/* 3 columns on desktop, stacked sections on phones. */}
            <div className="grid gap-4 md:grid-cols-3">
              {periods.map((period) => {
                const PeriodIcon = PERIOD_ICONS[period.key];
                return (
                  <div
                    key={period.key}
                    className="flex flex-col rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <PeriodIcon size={14} className="text-gray-900" />
                      <span className="text-sm font-bold text-gray-800">
                        {period.label}
                      </span>
                      <span className="font-dm-sans ml-auto text-[10px] font-medium text-gray-400">
                        {period.range[0] / 60}:00–{period.range[1] / 60}:00
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {period.slots.map((slot) => (
                        <SlotTile
                          key={slot}
                          slot={slot}
                          entry={statusBySlot[slot]}
                          selected={selectedRange.includes(slot)}
                          selectable={isSelectableStart(
                            slot,
                            statusBySlot,
                            need
                          )}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Tap a{" "}
              <span className="font-semibold text-green-600">green slot</span> to
              book it.
            </p>

            {/* First-lesson summary + continue */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              {selectedLesson ? (
                <p className="text-sm text-gray-700">
                  Starts{" "}
                  <span className="font-semibold text-gray-900">
                    {formatDateShort(selectedDate)},{" "}
                    {formatTimeRange(selectedLesson.start, selectedLesson.end)}
                  </span>
                  ,{" "}
                  <span className="font-dm-sans font-semibold text-gray-900">
                    {days} days
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Select a slot to see your first lesson summary.
                </p>
              )}

              {showNeedNotice && (
                <p
                  role="status"
                  className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700"
                >
                  Lesson length changed — please choose a new slot.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <p className="text-xs text-gray-400">
                {need > 1
                  ? `${minutes} min lesson uses ${need} consecutive slots.`
                  : "30 min lesson uses 1 slot."}
              </p>
              <button
                type="button"
                onClick={onContinue}
                disabled={!selectedSlot}
                title={
                  selectedSlot
                    ? "Continue to booking details"
                    : "Select a slot to continue"
                }
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gray-900 px-6 text-sm font-bold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-900"
              >
                Continue to Booking Details
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
