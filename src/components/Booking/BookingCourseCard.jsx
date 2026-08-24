import { CheckCircle2 } from "lucide-react";

function BookingCourseCard({
  title,
  description,
  price,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        w-full
        rounded-xl
        border-2
        p-3.5
        text-left
        transition-all
        duration-300

        ${
          selected
            ? "border-[#FF6201] bg-orange-50 shadow-lg"
            : "border-gray-200 bg-white hover:border-[#FF6201] hover:shadow-md"
        }
      `}
    >
      {selected && (
        <div className="absolute right-3 top-3 text-[#FF6201]">
          <CheckCircle2 size={18} />
        </div>
      )}

      <h3 className="pr-6 text-base font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-0.5 text-xs text-gray-500">
        {description}
      </p>

      <div className="mt-2.5 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Starting From
          </p>

          <h4 className="text-xl font-black text-[#FF3131]">
            {price}
          </h4>
        </div>
      </div>
    </button>
  );
}

export default BookingCourseCard;
