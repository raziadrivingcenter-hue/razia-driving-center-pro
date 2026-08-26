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
        <label className="mb-1 block text-sm font-semibold text-gray-300">
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
          rounded-xl
          border
          border-white/20
          bg-white/[0.08]
          px-3
          py-2.5
          text-left
          text-sm
          text-gray-100
          backdrop-blur-sm
          transition-all
          duration-300
          hover:border-[#FF6201]/60
          focus:border-[#FF6201]/70
          focus:ring-4
          focus:ring-[#FF6201]/20
        "
      >
        <span
          className={
            value
              ? "text-gray-100"
              : "text-white/40"
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
            size={16}
            className="text-white/50"
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
              rounded-xl
              border
              border-white/20
              bg-white/[0.10]
              shadow-xl
              backdrop-blur-xl
              saturate-[1.2]

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
                  px-3
                  py-2
                  text-sm
                  text-left
                  transition-all
                  duration-150

                  ${
                    value === option
                      ? "bg-[#FF6201]/20 text-[#FF6201]"
                      : "hover:bg-white/10 text-gray-100"
                  }
                `}
              >
                <span>{option}</span>

                {value === option && (
                  <Check
                    size={14}
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
