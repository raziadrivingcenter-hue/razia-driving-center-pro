import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, CheckCircle2, LoaderCircle, AlertTriangle } from "lucide-react";

import { submitSlotBooking } from "../../lib/slotAvailability";

function formatTime12(timeStr) {
  // "09:00" or "09:00:00" → "9:00 AM"
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

export default function BookingModal({ isOpen, onClose, slot, date }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { bookingId, message, whatsappLink }
  const [submitError, setSubmitError] = useState("");

  const reset = () => {
    setName("");
    setPhone("");
    setErrors({});
    setSubmitting(false);
    setResult(null);
    setSubmitError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!phone.trim()) e.phone = "Please enter your phone number";
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
      });
      setResult(res);
    } catch (err) {
      setSubmitError(
        err.details?.join(", ") ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <AnimatePresence mode="wait">
              {!result ? (
                /* ── Booking form ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Book This Slot
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {date} &middot; {formatTime12(slot.time)}
                  </p>
                  {slot.vehicleName && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {slot.vehicleName}
                    </p>
                  )}

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Name */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <User size={14} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ali Hassan"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                          errors.name
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <Phone size={14} />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0300 1234567"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                          errors.phone
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-200 focus:border-[#FF6201] focus:ring-[#FF6201]/20"
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                      )}
                    </div>

                    {/* Error */}
                    {submitError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        {submitError}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Reserving...
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 size={28} className="text-green-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    Slot Reserved!
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{result.message}</p>

                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Booking ID</span>
                      <span className="font-semibold text-gray-900">
                        #{result.bookingId}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-900">{date}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium text-gray-900">
                        {formatTime12(slot.time)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <a
                      href={result.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1da851]"
                    >
                      Confirm via WhatsApp
                    </a>
                    <button
                      onClick={handleClose}
                      className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
