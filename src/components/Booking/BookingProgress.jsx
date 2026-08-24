import { Check, X } from "lucide-react";

function BookingProgress({ step, onClose }) {
  return (
    <div className="relative bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 pb-4 pt-4">

      {/* Close Button */}

      <button
        onClick={onClose}
        className="
          absolute
          right-3
          top-3
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-lg
          text-white/80
          transition
          hover:bg-white/20
          hover:text-white
        "
      >
        <X size={16} />
      </button>

      <h2 className="text-lg font-black text-white">
        Book Your Driving Course
      </h2>

      <p className="mt-0.5 text-xs text-white/80">
        Complete your booking in 3 simple steps.
      </p>

      <div className="mt-4 flex items-center">

        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className="flex flex-1 items-center"
          >

            {/* Circle */}

            <div
              className={`
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              border-2
              text-sm
              font-bold
              transition-all
              duration-500

              ${
                step > number
                  ? "bg-white text-[#FF6201] border-white"
                  : step === number
                  ? "bg-white text-[#FF6201] border-white scale-105"
                  : "border-white/40 text-white"
              }
              `}
            >

              {step > number ? (
                <Check size={14} />
              ) : (
                number
              )}

            </div>

            {/* Line */}

            {number !== 3 && (
              <div
                className={`
                h-0.5
                flex-1
                transition-all
                duration-500
                ${
                  step > number
                    ? "bg-white"
                    : "bg-white/30"
                }
                `}
              />
            )}

          </div>
        ))}

      </div>

    </div>
  );
}

export default BookingProgress;
