import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

import { fetchAvailability } from "../../lib/slotAvailability";
import BookingForm from "./BookingForm";

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

// "Today" / "Tomorrow" / "in N days"
function daysLeftLabel(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}

// Split the day into three display periods.
const PERIODS = [
  { key: "morning", label: "Morning", icon: Sunrise, range: [7 * 60, 12 * 60] },
  { key: "afternoon", label: "Afternoon", icon: Sun, range: [12 * 60, 17 * 60] },
  { key: "evening", label: "Evening", icon: Sunset, range: [17 * 60, 19 * 60] },
];

export default function SlotAvailability() {
  const [selectedDate, setSelectedDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null); // { time }

  // Compute once on mount (lazy init) — avoids impure Date.now() during render.
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setBookingSlot(null);

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

  // Aggregate per time-slot across all vehicles: a slot is "available" if ANY
  // vehicle is free at that time, "booked" if at least one booking covers it,
  // or "empty" if no vehicle operates then. Vehicle names stay out of the UI.
  const slotStatus = useMemo(() => {
    const result = {};
    for (const slot of SLOT_STARTS) result[slot] = { status: "empty" };
    if (!data) return result;

    for (const slot of SLOT_STARTS) {
      const gridMin = timeToMin(slot);

      // Find any booking covering this grid cell (60-min API slot spans two cells).
      const booking = (data.blockedSlots || []).find(
        (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
      );
      if (booking) {
        result[slot] = { status: "booked", studentName: booking.studentName };
        continue;
      }

      // Available if any available-slot entry covers this cell.
      const free = (data.availableSlots || []).some(
        (s) => gridMin >= timeToMin(s.time) && gridMin < timeToMin(s.end)
      );
      if (free) {
        result[slot] = { status: "available" };
      }
    }
    return result;
  }, [data]);

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
  const availableCount = data?.availableCount ?? 0;
  const blockedCount = data?.blockedCount ?? 0;

  const handleSlotClick = (slot) => {
    const entry = slotStatus[slot];
    if (entry?.status === "available") {
      setBookingSlot({ time: slot });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Book Your Slot</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Pick a date and claim an available training slot. 30-minute blocks, 7 AM – 7 PM.
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
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-[#FF6201] focus:ring-4 focus:ring-[#FF6201]/10"
          />
        </div>

        {/* Content */}
        <div className="mt-8">
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
          ) : (
            <AnimatePresence mode="wait">
              {!bookingSlot ? (
                /* ── Slot grid ── */
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Stats bar */}
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-xs font-medium text-gray-700">
                        {availableCount} available
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <Users size={14} className="text-red-400" />
                      <span className="text-xs font-medium text-gray-700">
                        {blockedCount} booked
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                      <CarFront size={14} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">
                        {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* 3-column periods */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {periods.map((period) => {
                      const PeriodIcon = period.icon;
                      return (
                        <div
                          key={period.key}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <PeriodIcon size={16} className="text-[#FF6201]" />
                            <span className="text-sm font-bold text-gray-800">
                              {period.label}
                            </span>
                            <span className="ml-auto text-[10px] font-medium text-gray-400">
                              {period.range[0] / 60}:00–{period.range[1] / 60}:00
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {period.slots.map((slot) => {
                              const entry = slotStatus[slot];
                              const label = formatTime12(slot);

                              if (entry.status === "available") {
                                return (
                                  <motion.button
                                    key={slot}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSlotClick(slot)}
                                    className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left transition hover:border-green-300 hover:bg-green-100"
                                  >
                                    <span className="text-sm font-semibold text-green-700">
                                      {label}
                                    </span>
                                    <span className="rounded-full bg-green-200/60 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                      Book
                                    </span>
                                  </motion.button>
                                );
                              }

                              if (entry.status === "booked") {
                                return (
                                  <div
                                    key={slot}
                                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-red-700">
                                        {label}
                                      </span>
                                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                                        {daysLeftLabel(selectedDate)}
                                      </span>
                                    </div>
                                    <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                                      {entry.studentName}
                                    </span>
                                  </div>
                                );
                              }

                              // empty — vehicle not operating
                              return (
                                <div
                                  key={slot}
                                  className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-300"
                                >
                                  {label}
                                  <span className="ml-1 text-xs">—</span>
                                </div>
                              );
                            })}
                          </div>
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <BookingForm
                    slot={bookingSlot}
                    date={selectedDate}
                    onBack={() => setBookingSlot(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
