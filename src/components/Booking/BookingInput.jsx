import { CheckCircle2, AlertCircle } from "lucide-react";

function BookingInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  success,
  icon: Icon,
}) {
  return (
    <div>

      <label className="mb-1 block text-sm font-semibold text-gray-800">
        {label}
      </label>

      <div className="relative">

        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full
            rounded-xl
            border
            bg-white
            py-2.5
            pr-9
            text-sm
            text-gray-800
            outline-none
            transition-all
            duration-300
            ${Icon ? "pl-9" : "px-3"}

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
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
          />
        )}

        {error && (
          <AlertCircle
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
          />
        )}

      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}

export default BookingInput;
