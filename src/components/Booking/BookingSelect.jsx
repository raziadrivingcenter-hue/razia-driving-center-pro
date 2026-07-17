import { useRef } from "react";

function BookingSelect({
  label,
  value,
  onChange,
  options,
}) {
  const selectRef = useRef(null);

  const handleFocus = () => {
    setTimeout(() => {
      selectRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);
  };

  return (
    <div className="w-full">

      <label className="mb-2 block font-semibold text-gray-800">
        {label}
      </label>

      <div className="relative">

        <select
          ref={selectRef}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onClick={handleFocus}
          className="
            w-full
            appearance-none
            rounded-2xl
            border
            border-gray-200
            bg-white
            px-4
            py-4
            pr-12
            text-gray-800
            outline-none
            transition-all
            duration-300
            focus:border-[#FF6201]
            focus:ring-4
            focus:ring-orange-100
          "
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        {/* Custom Arrow */}

        <svg
          className="
            pointer-events-none
            absolute
            right-4
            top-1/2
            h-5
            w-5
            -translate-y-1/2
            text-gray-400
          "
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>

      </div>

    </div>
  );
}

export default BookingSelect;