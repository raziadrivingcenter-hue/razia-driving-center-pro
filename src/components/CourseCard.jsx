import PremiumCard from "./UI/PremiumCard";
import PrimaryButton from "./UI/PrimaryButton";
import {
  Clock3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function CourseCard({
  title,
  oldPrice,
  price,
  duration,
  features,
  popular,
  onBook,
}) {
  return (
    <PremiumCard
      className={`p-5 ${
        popular ? "border-2 border-[#FF6201]" : ""
      }`}
    >
      {/* Most Popular */}

      {popular && (
        <div className="absolute right-5 top-5">
          <span
            className="
            rounded-full
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-3
            py-1.5
            text-[10px]
            font-bold
            tracking-wide
            text-white
            shadow-lg
            "
          >
            ⭐ MOST POPULAR
          </span>
        </div>
      )}

      <div className={popular ? "mt-12" : ""}>
        {/* Title */}

        <h3 className="text-2xl font-black text-gray-900">
          {title}
        </h3>

        {/* Description */}

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {title === "Economy Driving Course" &&
            "Perfect for first-time learners who want professional driving lessons."}

          {title === "Pro Driver Course" &&
            "Master busy roads, parking and advanced driving with confidence."}

          {title === "Own Vehicle Training" &&
            "Learn comfortably using your own vehicle with expert guidance."}
        </p>

        {/* Price */}

        <div className="mt-6">
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

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
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

        <div className="mt-6 space-y-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3"
            >
              <CheckCircle2
                size={18}
                className="shrink-0 text-green-500"
              />

              <span className="text-sm text-gray-700">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Text */}

        <p className="mt-6 text-center text-xs text-gray-500">
          ✔ Free Consultation

          <span className="mx-2">•</span>

          ✔ Flexible Timings
        </p>

        {/* Divider */}

        <div className="my-6 border-t border-gray-200"></div>

        {/* CTA */}

        <PrimaryButton
          onClick={() =>
            onBook?.({
              course: title,
            })
          }
          className="group w-full py-3 text-base"
        >
          Book Your Seat

          <ArrowRight
            size={18}
            className="
            transition-transform
            duration-300
            group-hover:translate-x-1
            "
          />
        </PrimaryButton>
      </div>
    </PremiumCard>
  );
}

export default CourseCard;