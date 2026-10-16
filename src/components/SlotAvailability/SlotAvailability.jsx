import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  AlertTriangle,
  CarFront,
  Users,
  CheckCircle2,
} from "lucide-react";

import { fetchAvailability } from "../../lib/slotAvailability";
import BookingModal from "./BookingModal";

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

export default function SlotAvailability() {
  const [selectedDate, setSelectedDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null); // { time, vehicleName }

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

  // Build a lookup: "vehicleId|slotStart" → { status, studentName, vehicleName }
  // A 60-min API slot (e.g. 09:00–10:00) covers both the 09:00 and 09:30
  // grid cells, so we match by time range rather than exact start.
  const slotMap = useMemo(() => {
    const map = new Map();
    if (!data) return map;

    const mark = (vid, start, end, entry) => {
      const endMin = timeToMin(end);
      for (const gridStart of SLOT_STARTS) {
        const gridMin = timeToMin(gridStart);
        if (gridMin >= timeToMin(start) && gridMin < endMin) {
          const key = `${vid}|${gridStart}`;
          // Booked takes priority over available
          if (entry.status === "booked" || !map.has(key)) {
            map.set(key, entry);
          }
        }
      }
    };

    for (const s of data.blockedSlots || []) {
      mark(s.vehicleId || "x", s.time, s.end, {
        status: "booked",
        studentName: s.studentName,
      });
    }
    for (const s of data.availableSlots || []) {
      mark(s.vehicleId || "x", s.time, s.end, { status: "available" });
    }
    return map;
  }, [data]);

  const vehicles = data?.vehicles || [];
  const synced = data?.synced ?? false;
  const availableCount = data?.availableCount ?? 0;
  const blockedCount = data?.blockedCount ?? 0;

  const handleCellClick = (slot, vehicleId, vehicleName) => {
    const key = `${vehicleId}|${slot}`;
    const entry = slotMap.get(key);
    if (entry?.status === "available") {
      setBookingSlot({ time: slot, vehicleId, vehicleName });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
            Book Your Slot
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Pick a date and claim an available training slot. 30-minute blocks,
            7 AM – 7 PM.
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
            <div className="mx-auto max-w-md flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !synced ? (
            <div className="mx-auto max-w-md flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
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
              {/* Stats bar */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {availableCount} available
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
                  <Users size={16} className="text-red-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {blockedCount} booked
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
                  <CarFront size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Time
                      </th>
                      {vehicles.map((v) => (
                        <th
                          key={v.id}
                          className="px-3 py-3 text-center text-xs font-semibold text-gray-700"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            <CarFront size={12} className="text-gray-400" />
                            {v.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOT_STARTS.map((slot) => {
                      const label = formatTime12(slot);
                      return (
                        <tr
                          key={slot}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-xs font-medium text-gray-600">
                            {label}
                          </td>
                          {vehicles.map((v) => {
                            const key = `${v.id}|${slot}`;
                            const entry = slotMap.get(key);

                            if (entry?.status === "booked") {
                              return (
                                <td key={key} className="px-2 py-1.5">
                                  <div className="flex flex-col items-center rounded-lg bg-red-50 px-2 py-2 text-center">
                                    <span className="text-[11px] font-semibold text-red-600">
                                      Booked
                                    </span>
                                    <span className="mt-0.5 truncate text-[10px] text-gray-500">
                                      {entry.studentName}
                                    </span>
                                    <span className="mt-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                                      {daysLeftLabel(selectedDate)}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (entry?.status === "available") {
                              return (
                                <td key={key} className="px-2 py-1.5">
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() =>
                                      handleCellClick(slot, v.id, v.name)
                                    }
                                    className="w-full rounded-lg border border-green-200 bg-green-50 px-2 py-2.5 text-center transition hover:border-green-300 hover:bg-green-100"
                                  >
                                    <span className="text-[11px] font-semibold text-green-700">
                                      Available
                                    </span>
                                  </motion.button>
                                </td>
                              );
                            }

                            // No data for this cell
                            return (
                              <td key={key} className="px-2 py-1.5">
                                <div className="rounded-lg bg-gray-50 py-2.5 text-center text-[11px] text-gray-300">
                                  —
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                Click an <span className="font-semibold text-green-600">Available</span>{" "}
                slot to reserve it.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Booking modal */}
      <BookingModal
        isOpen={!!bookingSlot}
        onClose={() => setBookingSlot(null)}
        slot={bookingSlot || { time: "" }}
        date={selectedDate}
      />
    </div>
  );
}
