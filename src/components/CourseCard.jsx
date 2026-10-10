import PremiumCard from "./UI/PremiumCard";
import PrimaryButton from "./UI/PrimaryButton";
import {
  Clock3,
  CheckCircle2,
} from "lucide-react";

function CourseCard({
  name,
  title,
  oldPrice,
  price,
  duration,
  features,
  badge,
  titleIcon: TitleIcon,
  onBook,
}) {
  // Show only the first 4 features to keep the card compact.
  const shortFeatures = features.slice(0, 4);

  return (
    <PremiumCard
      className={`p-4 ${
        badge ? "border-2 border-[#FF6201]" : ""
      }`}
    >
      {/* Badge (Most Selling / Public Favorite) — top-right corner */}

      {badge && (
        <div className="absolute right-3 top-3 z-10">
          <span
            className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-2.5
            py-1
            text-[9px]
            font-bold
            tracking-wide
            text-white
            shadow-lg
            "
          >
            <badge.icon size={10} />

            {badge.text}
          </span>
        </div>
      )}

      {/* FREE Pick & Drop Badge — PLUS Plan only */}

      {name === "Economy Driving Course" && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-md">
            🚗 FREE Pick & Drop upto 2 KM
          </span>
        </div>
      )}

      <div className={badge ? "mt-6" : ""}>
        {/* Title */}

        <h2 className="flex items-center gap-2 text-lg font-black leading-tight text-gray-900">
          {TitleIcon && (
            <TitleIcon
              size={18}
              className="shrink-0 text-[#FF6201]"
            />
          )}

          {title}
        </h2>

        {/* Price */}

        <div className="mt-2 flex items-end gap-2">
          <h2 className="text-2xl font-black leading-none text-[#FF3131]">
            {price}
          </h2>

          <span className="pb-0.5 text-sm text-gray-500 line-through">
            {oldPrice}
          </span>
        </div>

        {/* Duration */}

        <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5">
          <Clock3 size={14} className="shrink-0 text-[#FF6201]" />

          <span className="text-xs font-semibold text-gray-700">
            {duration}
          </span>
        </div>

        {/* Features */}

        <div className="mt-3 space-y-1.5">
          {shortFeatures.map((feature) => {
            const isObject = typeof feature === "object";
            const Icon = isObject ? feature.icon : CheckCircle2;
            const text = isObject ? feature.text : feature;
            const iconColor = isObject
              ? "text-[#FF6201]"
              : "text-green-500";

            return (
              <div
                key={text}
                className="flex items-start gap-2"
              >
                <Icon
                  size={15}
                  className={`mt-0.5 shrink-0 ${iconColor}`}
                />

                <span className="text-xs leading-[1.4] text-gray-700">
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}

        <div className="my-3 border-t border-gray-200"></div>

        {/* CTA */}

        <PrimaryButton
          onClick={() =>
            onBook?.({
              course: name,
            })
          }
          className="w-full py-2 text-sm"
          hideArrow
        >
          Book This Plan
        </PrimaryButton>
      </div>
    </PremiumCard>
  );
}

export default CourseCard;
