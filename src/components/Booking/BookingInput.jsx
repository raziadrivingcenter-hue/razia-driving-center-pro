import { CheckCircle2, AlertCircle } from "lucide-react";

function BookingInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  success,
}) {
  return (
    <div>

      <label className="mb-2 block font-semibold text-gray-800">
        {label}
      </label>

      <div className="relative">

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full
            rounded-2xl
            border
            bg-white
            p-4
            pr-12
            text-gray-800
            outline-none
            transition-all
            duration-300

            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : success
                ? "border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                : "border-gray-200 focus:border-[#FF6201] focus:ring-4 focus:ring-orange-100"
            }
          `}
        />

        {success && (
          <CheckCircle2
            size={22}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
          />
        )}

        {error && (
          <AlertCircle
            size={22}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
          />
        )}

      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}

export default BookingInput;