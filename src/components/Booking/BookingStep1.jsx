import BookingInput from "./BookingInput";

function BookingStep1({
  formData,
  setFormData,
  next,
}) {
  const phoneRegex = /^03\d{9}$/;

  const nameValid = formData.name.trim().length >= 3;
  const phoneValid = phoneRegex.test(formData.phone);
  const areaValid = formData.area.trim().length >= 2;

  const canContinue =
    nameValid &&
    phoneValid &&
    areaValid;

  return (
    <div className="px-5 pb-5 pt-4">

      <h2 className="text-3xl font-black">
        Your Information
      </h2>

      <p className="mt-2 text-gray-500">
        Tell us a little about yourself.
      </p>

      <div className="mt-8 space-y-6">

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

      <div className="mt-10 flex justify-end">

        <button
          onClick={next}
          disabled={!canContinue}
          className="
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-8
            py-3
            font-bold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
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