import BookingInput from "./BookingInput";
import BookingLiveSummary from "./BookingLiveSummary";

function BookingStep1({
  formData,
  setFormData,
  next,
}) {
  const phoneRegex = /^03\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const nameValid = formData.name.trim().length >= 3;
  const phoneValid = phoneRegex.test(formData.phone);
  const emailValid =
    formData.email.trim().length === 0 ||
    emailRegex.test(formData.email);
  const areaValid = formData.area.trim().length >= 2;

  const canContinue =
    nameValid &&
    phoneValid &&
    areaValid;

  return (
    <div className="rounded-b-2xl border border-white/25 bg-white/[0.07] px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl">
      <div className="mt-3">
        <BookingLiveSummary formData={formData} />
      </div>
      <h2 className="text-lg font-black text-white">
        Your Information
      </h2>

      <p className="mt-0.5 text-xs text-gray-300">
        Tell us a little about yourself.
      </p>

      

      <div className="mt-4 grid grid-cols-2 gap-3">

        <BookingInput
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value,
            })
          }
          success={nameValid}
          error={
            formData.name.length > 0 && !nameValid
              ? "Please enter at least 3 characters."
              : ""
          }
        />

        <BookingInput
          label="WhatsApp Number"
          type="tel"
          placeholder="03XXXXXXXXX"
          value={formData.phone}
          onChange={(e) => {
            const onlyNumbers = e.target.value.replace(/\D/g, "");

            setFormData({
              ...formData,
              phone: onlyNumbers.slice(0, 11),
            });
          }}
          success={phoneValid}
          error={
            formData.phone.length > 0 && !phoneValid
              ? "Enter a valid WhatsApp number (03XXXXXXXXX)."
              : ""
          }
        />

        <BookingInput
          label="Email (Optional)"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
          success={emailValid}
          error={
            formData.email.length > 0 && !emailValid
              ? "Please enter a valid email address."
              : ""
          }
        />

        <BookingInput
          label="Your Area"
          placeholder="e.g. Gulberg"
          value={formData.area}
          onChange={(e) =>
            setFormData({
              ...formData,
              area: e.target.value,
            })
          }
          success={areaValid}
          error={
            formData.area.length > 0 && !areaValid
              ? "Please enter your area."
              : ""
          }
        />

      </div>

      <div className="mt-4 flex justify-end">

        <button
          onClick={next}
          disabled={!canContinue}
          className="
            h-[42px]
            w-[130px]
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            text-sm
            font-bold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-40
            disabled:hover:translate-y-0
          "
        >
          Continue →
        </button>

      </div>

    </div>
  );
}

export default BookingStep1;
