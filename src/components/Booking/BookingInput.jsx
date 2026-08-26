import { CheckCircle2, AlertCircle } from "lucide-react";

function BookingInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  success,
  errorIcon: ErrorIcon = AlertCircle,
  hideErrorText = false,
  icon: Icon,
}) {
  return (
    <div>

      <label className="mb-1 block text-sm font-semibold text-gray-300">
        {label}
    </label>

      <div className="relative">

        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
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
            border-white/20
            bg-white/[0.08]
            py-2.5
            pr-9
            text-sm
            text-gray-100
            placeholder-white/40
            outline-none
            backdrop-blur-sm
            transition-all
            duration-300
            ${Icon ? "pl-9" : "px-3"}

            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                : success
                ? "border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/20"
                : "focus:border-[#FF6201] focus:ring-4 focus:ring-[#FF6201]/20"
            }
          `}
        />

        {success && (
          <CheckCircle2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
          />
        )}

        {error && (
          <ErrorIcon
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400"
          />
        )}

      </div>

      {error && !hideErrorText && (
        <p className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      )}

    </div>
  );
}

export default BookingInput;
