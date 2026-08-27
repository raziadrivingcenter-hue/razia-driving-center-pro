import { variantConfig } from "../../data/courseCardVariants";

function BookingCourseCard({
  title,
  oldPrice,
  price,
  duration,
  detail,
  variant = "silver",
  badge,
  selected,
  onClick,
}) {
  const isPro = title === "PRO+ Plan";
  const config = variantConfig[variant];

  // Extract the numeric portion (e.g. "Rs. 14,500" -> "14,500").
  const priceNum = price.replace(/^[^\d]*/, "");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full rounded-2xl text-center
        transition-all duration-300 ease-out overflow-visible

        ${
          selected
            ? "scale-[1.03] shadow-xl"
            : "shadow-md hover:scale-[1.02] hover:shadow-lg"
        }
      `}
      style={{
        background: config.bg,
        color: config.text,
        padding: "1.25rem 1rem",
        border: selected
          ? `3px solid ${config.border}`
          : "3px solid transparent",
      }}
    >
      {/* Premium star badge — top-right corner of the gold card. */}
      {isPro && (
        <span
          className="absolute -top-2.5 -right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md ring-2 ring-[#D4A028]"
          aria-label="Premium choice"
        >
          ⭐
        </span>
      )}

      {/* Promotional badge — top-right corner (e.g. PLUS Plan "Most Selling"). */}
      {badge && !isPro && (
        <span
          className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-2 py-0.5 text-[8px] font-bold tracking-wide text-white shadow-lg"
        >
          <badge.icon size={9} />
          {badge.text}
        </span>
      )}

      {/* Plan name */}
      <h3 className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
        {title}
      </h3>

      {/* Original price — strikethrough, muted */}
      {oldPrice && (
        <p
          className="mt-1 text-xs font-semibold sm:text-sm"
          style={{ color: config.oldPrice }}
        >
          <s>{oldPrice}</s>
        </p>
      )}

      {/* Discounted price — the hero number */}
      <p className="mt-1" style={{ lineHeight: 1.1 }}>
        <span className="align-top text-xs font-extrabold sm:text-sm">
          Rs.
        </span>
        <span className="text-xl font-black sm:text-2xl">
          {priceNum}
        </span>
      </p>

      {/* Duration line */}
      {duration && (
        <p
          className="mt-3 text-xs font-bold uppercase tracking-widest sm:text-sm"
          style={{ color: config.text }}
        >
          {duration}
        </p>
      )}

      {/* Key training detail — one-liner */}
      {detail && (
        <p
          className="mt-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
          style={{ color: config.subtext }}
        >
          {detail}
        </p>
      )}
    </button>
  );
}

export default BookingCourseCard;
