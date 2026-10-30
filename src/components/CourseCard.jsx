import { Clock3, Check, Sparkles, Gift } from "lucide-react";

function CourseCard({
  name,
  title,
  oldPrice,
  price,
  duration,
  features,
  titleIcon: TitleIcon,
  onBook,
  popular = false,
  compact = false,
}) {
  const savings =
    oldPrice && price
      ? parseInt(oldPrice.replace(/\D/g, "")) -
        parseInt(price.replace(/\D/g, ""))
      : 0;

  // Split "7 Days Training" → number + unit text.
  const durationParts = duration ? duration.match(/^(\d+)\s*(.*)$/) : null;
  const durationNumber = durationParts ? durationParts[1] : duration;
  const durationUnit = durationParts ? durationParts[2] : "";

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl bg-white
        shadow-sm transition-shadow duration-200
        hover:shadow-md
        ${popular
          ? "border-2 border-[#FF6201]"
          : "border border-gray-200 hover:border-gray-300"}
      `}
    >
      {/* Free Pick & Drop marquee — PLUS Plan only */}
      {popular && (
        <div className="relative overflow-hidden bg-gray-100 py-1">
          <div
            className="flex w-max whitespace-nowrap animate-marquee"
            style={{ animationDuration: "30s" }}
          >
            {Array.from({ length: 2 }).map((_, setIdx) => (
              <span key={setIdx} className="flex">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={setIdx + "-" + i}
                    className="flex shrink-0 items-center gap-1 px-6 text-[11px] font-semibold text-gray-500"
                  >
                    <Gift size={10} className="shrink-0" />
                    Free Pick &amp; Drop Upto <span className="font-dm-sans">2</span> Km
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Popular badge */}
      {popular && (
        <div className="absolute right-3 top-8 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#FF6201]">
            <Sparkles size={10} />
            Most Popular
          </span>
        </div>
      )}

      <div className={compact ? "p-3" : "p-5"}>
        {/* Plan name */}
        <div className="flex items-center gap-2">
          {TitleIcon && (
            <TitleIcon size={18} className="shrink-0 text-[#FF6201]" />
          )}
          <h3 className="text-lg font-bold leading-tight text-gray-900">
            {title}
          </h3>
        </div>

        {/* Pricing */}
        <div className={compact ? "mt-2 flex items-baseline gap-2" : "mt-3 flex items-baseline gap-2"}>
          <span className="text-3xl font-black leading-none text-gray-900">
            <span className="font-dm-sans">{price}</span>
          </span>
          {oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              <span className="font-dm-sans">{oldPrice}</span>
            </span>
          )}
        </div>
        {savings > 0 && (
          <span className="mt-1 inline-block text-xs font-semibold text-[#FF6201]">
            Save Rs. <span className="font-dm-sans">{savings.toLocaleString()}</span>
          </span>
        )}

        {/* Duration */}
        <div className={compact ? "mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1" : "mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5"}>
          <Clock3 size={14} className="shrink-0 text-[#FF6201]" />
          <span className="text-xs font-semibold text-gray-700">
            <span className="font-dm-sans">{durationNumber}</span> {durationUnit}
          </span>
        </div>

        {/* Features */}
        <ul className={compact ? "mt-3 space-y-1.5" : "mt-4 space-y-2"}>
          {features.map((feature) => {
            const Icon = feature.icon || Check;
            const iconColor = feature.icon ? "text-[#FF6201]" : "text-gray-400";

            return (
              <li key={feature.text} className="flex items-start gap-2.5">
                <Icon size={15} className={`mt-0.5 shrink-0 ${iconColor}`} />
                <span className="text-sm leading-[1.45] text-gray-600">
                  {feature.text}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className={compact ? "mt-3 border-t border-gray-100" : "mt-4 border-t border-gray-100"} />

        {/* CTA */}
        <button
          onClick={() => onBook?.({ course: name })}
          className={`btn-interactive inline-flex w-full items-center justify-center rounded-md text-sm font-semibold transition-colors duration-200
            ${compact ? "mt-3 h-9" : "mt-4 h-11 "}
            ${popular
              ? "bg-[#FF6201] text-white hover:bg-[#e55600]"
              : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
        >
          Book This Plan
        </button>
      </div>
    </div>
  );
}

export default CourseCard;

/* Marquee animation — injected once via the component's style tag */
const MARQUEE_STYLE = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    animation: marquee linear infinite;
  }
`;

// Inject the marquee keyframes into the document head (once)
if (typeof document !== "undefined" && !document.getElementById("marquee-style")) {
  const style = document.createElement("style");
  style.id = "marquee-style";
  style.textContent = MARQUEE_STYLE;
  document.head.appendChild(style);
}
