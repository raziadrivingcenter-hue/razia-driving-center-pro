import { Check } from "lucide-react";

function BookingProgress({ step }) {
  return (
    <div className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] p-8">

      <h2 className="text-3xl font-black text-white">
        Book Your Driving Course
      </h2>

      <p className="mt-2 text-white/80">
        Complete your booking in just 3 simple steps.
      </p>

      <div className="mt-8 flex items-center">

        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className="flex flex-1 items-center"
          >

            {/* Circle */}

            <div
              className={`
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border-2
              font-bold
              transition-all
              duration-500

              ${
                step > number
                  ? "bg-white text-[#FF6201] border-white"
                  : step === number
                  ? "bg-white text-[#FF6201] border-white scale-110"
                  : "border-white/40 text-white"
              }
              `}
            >

              {step > number ? (
                <Check size={20} />
              ) : (
                number
              )}

            </div>

            {/* Line */}

            {number !== 3 && (
              <div
                className={`
                h-1
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