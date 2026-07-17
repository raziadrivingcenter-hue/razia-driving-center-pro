import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function CustomSelect({
  label,
  value,
  onChange,
  options,
}) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
  }, []);

  const handleSelect = (option) => {
    onChange({
      target: {
        value: option,
      },
    });

    setOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
    >
      {label && (
        <label className="mb-2 block font-semibold text-gray-800">
          {label}
        </label>
      )}

      {/* Select Button */}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-2xl
          border
          border-gray-200
          bg-white
          px-4
          py-3
          text-left
          transition-all
          duration-300
          hover:border-[#FF6201]
          focus:border-[#FF6201]
          focus:ring-4
          focus:ring-orange-100
        "
      >
        <span
          className={
            value
              ? "text-gray-900"
              : "text-gray-400"
          }
        >
          {value || options[0]}
        </span>

        <motion.div
          animate={{
            rotate: open ? 180 : 0,
          }}
          transition={{
            duration: 0.25,
          }}
        >
          <ChevronDown
            size={18}
            className="text-gray-400"
          />
        </motion.div>
      </button>

      {/* Dropdown */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
            }}
            className="
              absolute
              left-0
              right-0
              z-50
              mt-2
              max-h-48
              overflow-y-auto
              rounded-2xl
              border
              border-orange-100
              bg-white
              shadow-xl

              scrollbar-thin
              scrollbar-thumb-orange-300
              scrollbar-track-transparent
            "
            style={{
              scrollbarWidth: "thin",
            }}
          >
            {options.slice(1).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  handleSelect(option)
                }
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  px-4
                  py-2.5
                  text-sm
                  text-left
                  transition-all
                  duration-150

                  ${
                    value === option
                      ? "bg-orange-50 text-[#FF6201]"
                      : "hover:bg-orange-50"
                  }
                `}
              >
                <span>{option}</span>

                {value === option && (
                  <Check
                    size={16}
                    className="text-[#FF6201]"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomSelect;