import { useState, useEffect } from "react";
import { X } from "lucide-react";

function BookingModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [course, setCourse] = useState("");
  const [pickup, setPickup] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBooking = () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your WhatsApp number.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 11) {
      setError("Please enter a valid WhatsApp number.");
      return;
    }

    if (!course) {
      setError("Please select a driving course.");
      return;
    }

    const message = `Hello Razia Driving Center,

🚗 New Website Booking

👤 Name:
${name}

📞 Phone:
${phone}

📍 Area:
${area}

🚘 Course:
${course}

🚖 Pick & Drop:
${pickup}

🕒 Preferred Training Time:
${time}

📝 Additional Notes:
${notes}

Please contact me.`;

    const whatsappURL = `https://wa.me/923094461407?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappURL, "_blank");

    onClose();

    setName("");
    setPhone("");
    setArea("");
    setCourse("");
    setPickup("");
    setTime("");
    setNotes("");
    setError("");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-scaleIn"
      >
        {/* Header */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black">
              Book Driving Course
            </h2>

            <p className="mt-2 text-gray-500">
              Fill in your details below and we'll contact you shortly.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-gray-100"
          >
            <X />
          </button>
        </div>

        {/* Form */}

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          />

          <input
            type="tel"
            placeholder="WhatsApp Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          />

          <input
            type="text"
            placeholder="Your Area (e.g. Gulberg)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          />

          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          >
            <option value="">Select Driving Course</option>
            <option>Economy Driving Course</option>
            <option>Pro Driver Course</option>
            <option>Own Vehicle Training</option>
          </select>

          <select
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          >
            <option value="">Need Pick & Drop?</option>
            <option>Yes</option>
            <option>No</option>
          </select>

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          >
            <option value="">Preferred Training Time</option>
            <option>Morning (8 AM - 12 PM)</option>
            <option>Afternoon (12 PM - 4 PM)</option>
            <option>Evening (4 PM - 8 PM)</option>
          </select>

          <textarea
            rows="4"
            placeholder="Additional Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:border-[#FF6201]"
          />

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-center font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleBooking}
            className="w-full rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
          >
            Book on WhatsApp
          </button>

        </div>

      </div>
    </div>
  );
}

export default BookingModal;