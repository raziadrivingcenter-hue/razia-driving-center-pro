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
  return (
    <PremiumCard
      className={`p-5 ${
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

      <div className={badge ? "mt-10" : ""}>
        {/* Title */}

        <h3 className="flex items-center gap-2 text-2xl font-black text-gray-900">
          {TitleIcon && (
            <TitleIcon
              size={20}
              className="shrink-0 text-[#FF6201]"
            />
          )}

          {title}
        </h3>

        {/* Description */}

        <p className="mt-1 text-sm leading-[1.35] text-gray-500">
          {name === "Basic Plan" &&
            "Perfect for first-time learners."}

          {name === "Economy Driving Course" &&
            "Perfect for first-time learners who want professional driving lessons."}

          {name === "Pro Driver Course" &&
            "Build advanced driving skills through intensive training on busy roads, parking and real traffic."}
        </p>

        {/* Price */}

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Starting From
          </p>

          <div className="mt-2 flex items-end gap-2">
            <h2 className="text-4xl font-black text-[#FF3131]">
              {price}
            </h2>

            <span className="pb-1 text-base text-gray-400 line-through">
              {oldPrice}
            </span>
          </div>
        </div>

        {/* Duration */}

        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div
              className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-orange-100
              text-[#FF6201]
              "
            >
              <Clock3 size={16} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Course Duration
              </p>

              <p className="text-sm font-semibold">
                {duration}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}

        <div className="mt-4 space-y-2">
          {features.map((feature) => {
            const isObject = typeof feature === "object";
            const Icon = isObject ? feature.icon : CheckCircle2;
            const text = isObject ? feature.text : feature;
            const iconColor = isObject
              ? "text-[#FF6201]"
              : "text-green-500";

            return (
              <div
                key={text}
                className="flex items-center gap-3"
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${iconColor}`}
                />

                <span className="text-sm text-gray-700">
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Text */}

        <p className="mt-4 text-center text-xs text-gray-500">
          ✔ Free Consultation

          <span className="mx-2">•</span>

          ✔ Flexible Timings
        </p>

        {/* Divider */}

        <div className="my-4 border-t border-gray-200"></div>

        {/* CTA */}

        <PrimaryButton
          onClick={() =>
            onBook?.({
              course: name,
            })
          }
          className="w-full py-2.5 text-sm"
          hideArrow
        >
          Book This Plan
        </PrimaryButton>
      </div>
    </PremiumCard>
  );
}

export default CourseCard;