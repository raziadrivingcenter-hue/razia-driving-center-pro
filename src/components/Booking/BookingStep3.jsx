import BookingSummary from "./BookingSummary";

import { CheckCircle2 } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import CustomSelect from "./CustomSelect";

function BookingStep3({
  formData,
  setFormData,
  back,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBooking = () => {
    if (!formData.course) {
      alert("Please select a driving course.");
      return;
    }

    if (!formData.time) {
      alert("Please select your preferred training time.");
      return;
    }

    let courseDetails = "";

    if (formData.course === "Custom Course") {
      courseDetails = `
🚘 Course:
Custom Driving Course

📅 Training Days:
${formData.customDays} Days

⏱ Lesson Duration:
${formData.customMinutes} Minutes Daily

💰 Estimated Fee:
Rs. ${Number(formData.customPrice).toLocaleString()}
`;
    } else {
      courseDetails = `
🚘 Course:
${formData.course}
`;
    }

    const message = `Hello Razia Driving Center,

🚗 New Website Booking

👤 Name:
${formData.name}

📞 Phone:
${formData.phone}

📍 Area:
${formData.area}

${courseDetails}

🚖 Pick & Drop:
${formData.pickup}

🕒 Preferred Training Time:
${formData.time}

📝 Additional Notes:
${formData.notes || "None"}

Please contact me.`;

    const whatsappURL =
      `https://wa.me/923094461407?text=${encodeURIComponent(message)}`;

    setLoading(true);
    setLoadingStep(1);

    setTimeout(() => {
      setLoadingStep(2);
    }, 700);

    setTimeout(() => {
      setLoadingStep(3);
    }, 1400);

    setTimeout(() => {
      setShowSuccess(true);

      window.open(whatsappURL, "_blank");

      setTimeout(() => {
        setLoading(false);
        setLoadingStep(0);
        setShowSuccess(false);
        onClose();
      }, 1800);

    }, 2200);
  };

  if (showSuccess) {
    return (
      <div className="p-10 text-center">

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">

          <CheckCircle2
            size={50}
            className="text-green-600"
          />

        </div>

        <h2 className="text-3xl font-black">
          Booking Ready!
        </h2>

        <p className="mt-3 text-gray-500">
          Redirecting you to WhatsApp...
        </p>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-gray-200">

          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201]" />

        </div>

        <p className="mt-6 text-sm text-gray-400">
          Please don't close this window.
        </p>

      </div>
    );
  }
    return (
    <div className="px-5 pb-5 pt-4">

      {/* Booking Summary */}

      <BookingSummary formData={formData} />

      <h2 className="mt-6 text-3xl font-black">
        Final Step
      </h2>

      <p className="mt-2 text-gray-500">
        Just a few more details before booking.
      </p>

      {/* Preferred Time */}

      <div className="mt-8">

        <CustomSelect
          label="Preferred Training Time"
          value={formData.time}
          onChange={(e) =>
            setFormData({
              ...formData,
              time: e.target.value,
            })
          }
          options={[
            "Select Time",
            "Morning (8 AM - 12 PM)",
            "Afternoon (12 PM - 4 PM)",
            "Evening (4 PM - 8 PM)",
          ]}
        />

      </div>

      {/* Notes */}

      <div className="mt-6">

        <label className="mb-2 block font-semibold">
          Additional Notes
        </label>

        <textarea
          rows="4"
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder="Anything you'd like us to know..."
          className="
            w-full
            rounded-2xl
            border
            border-gray-200
            p-4
            resize-none
            outline-none
            transition
            focus:border-[#FF6201]
            focus:ring-4
            focus:ring-orange-100
          "
        />

      </div>

      {/* Buttons */}

      <div className="mt-10 flex justify-between">

        <button
          onClick={back}
          className="
            rounded-xl
            border
            px-8
            py-3
            font-semibold
            transition
            hover:bg-gray-100
          "
        >
          ← Back
        </button>

        <button
          onClick={handleBooking}
          disabled={loading}
          className="
            flex
            min-w-[220px]
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-8
            py-3
            font-bold
            text-white
            shadow-lg
            transition
            hover:-translate-y-1
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-70
            disabled:hover:translate-y-0
          "
        >

          {loading ? (

            <div className="flex flex-col items-start gap-2">

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 1
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 1 ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                <span className="text-sm">
                  Checking Details...
                </span>

              </div>

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 2
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 2 ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <div className="h-[18px] w-[18px]" />
                )}

                <span className="text-sm">
                  Preparing Booking...
                </span>

              </div>

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 3
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 3 ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <div className="h-[18px] w-[18px]" />
                )}

                <span className="text-sm">
                  Opening WhatsApp...
                </span>

              </div>

            </div>

          ) : (

            <>
              <span>Book on WhatsApp</span>
            </>

          )}

        </button>

      </div>

    </div>
  );
}

export default BookingStep3;