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
        rounded-2xl
        border-2
        p-5
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
        <div className="absolute right-4 top-4 text-[#FF6201]">
          <CheckCircle2 size={20} />
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-900 pr-8">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Starting From
          </p>

          <h4 className="text-2xl font-black text-[#FF3131]">
            {price}
          </h4>
        </div>
      </div>
    </button>
  );
}

export default BookingCourseCard;