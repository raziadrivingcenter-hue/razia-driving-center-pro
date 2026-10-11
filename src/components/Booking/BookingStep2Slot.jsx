import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock3, LoaderCircle, AlertTriangle } from "lucide-react";

import { fetchAvailability } from "../../lib/bookingApi";
import { getCourseDurationDays } from "../../lib/pickDropCalculator";

function BookingStep2Slot({ formData, setFormData, pricing, next, back }) {
  const [selectedDate, setSelectedDate] = useState(formData.preferred_date || "");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(formData.slot_time || "");

  const durationDays = pricing.durationDays || getCourseDurationDays(formData.course);

  // Minimum date = today, max = +30 days
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetchAvailability(selectedDate)
      .then((data) => {
        if (cancelled) return;
        setSlots(data.availableSlots);
        if (data.availableCount === 0) {
          setError("No slots available on this date. Please pick another.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load slots.");
        setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot("");
    setFormData({ ...formData, preferred_date: date, slot_time: "" });
  };

  const handleSlotSelect = (slotTime) => {
    setSelectedSlot(slotTime);
    setFormData({ ...formData, slot_time: slotTime });
  };

  const canContinue = selectedDate && selectedSlot;

  return (
    <div className="rounded-b-2xl border border-white/25 bg-white/[0.07] px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl">

      {/* Heading */}

      <h2 className="mt-2 text-lg font-white text-white">
        Pick Date & Time
      </h2>

      <p className="mt-0.5 text-xs text-gray-300">
        Choose your preferred start date and training slot.
      </p>

      {/* Date Picker */}

      <div className="mt-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
          <CalendarDays size={14} className="text-[#FF6201]" />
          Start Date
        </label>

        <input
          type="date"
          min={today}
          max={maxDate}
          value={selectedDate}
          onChange={handleDateChange}
          className="
            w-full rounded-xl border border-white/20 bg-white/[0.08] p-3 text-sm text-gray-100
            outline-none backdrop-blur-sm transition focus:border-[#FF6201]
            focus:ring-4 focus:ring-[#FF6201]/20
          "
        />
      </div>

      {/* Multi-day info */}

      {selectedDate && durationDays > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3"
        >
          <div className="rounded-xl border border-[#FF6201]/30 bg-[#FF6201]/10 px-3 py-2">
            <p className="text-[11px] leading-4 text-[#FF6201]">
              Your selected time will be reserved every day for{" "}
              <span className="font-bold">{durationDays} days</span> ({" "}
              {new Date(selectedDate).toLocaleDateString("en-PK", { month: "short", day: "numeric" })} —{" "}
              {new Date(new Date(selectedDate).getTime() + (durationDays - 1) * 86400000).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}).
            </p>
          </div>
        </motion.div>
      )}

      {/* Slot Grid */}

      {selectedDate && (
        <div className="mt-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
            <Clock3 size={14} className="text-[#FF6201]" />
            Available Slots
            {slots.length > 0 && (
              <span className="ml-auto text-xs font-normal text-gray-400">
                {slots.length} available
              </span>
            )}
          </label>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-300">
              <LoaderCircle size={16} className="animate-spin" />
              Loading slots...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-3 text-sm text-yellow-300">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
              <AnimatePresence>
                {slots.map((slot) => (
                  <motion.button
                    key={slot.time}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleSlotSelect(slot.time)}
                    className={`
                      rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all duration-200
                      ${
                        selectedSlot === slot.time
                          ? "border-[#FF6201] bg-[#FF6201] text-white shadow-lg"
                          : "border-white/20 bg-white/[0.06] text-gray-200 hover:border-[#FF6201]/50 hover:bg-white/[0.12]"
                      }
                    `}
                  >
                    {slot.display}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Travel time hint */}

          {selectedSlot && formData.distance > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[11px] text-gray-400"
            >
              Instructor will arrive ~{Math.max(0, Math.round(Number(formData.distance) * 5))} min before your slot.
            </motion.p>
          )}
        </div>
      )}

      {/* Navigation */}

      <div className="mt-5 flex items-center justify-between">

        <button
          type="button"
          onClick={back}
          className="
            rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-gray-200
            transition hover:bg-white/10
          "
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className="
            h-[42px] rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201]
            px-6 text-sm font-bold text-white shadow-lg transition-all duration-300
            hover:-translate-y-0.5 hover:shadow-xl
            disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0
          "
        >
          Continue →
        </button>

      </div>

    </div>
  );
}

export default BookingStep2Slot;
