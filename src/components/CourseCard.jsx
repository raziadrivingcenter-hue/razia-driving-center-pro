import { useId, useLayoutEffect, useRef, useState } from "react";
import { Clock3, Check, Sparkles, Gift } from "lucide-react";

/* Notch geometry — exposed here for tuning. */
const NOTCH_W = 128;    // --notch-w
const NOTCH_H = 40;     // --notch-h
const NOTCH_R = 14;     // --notch-radius (card corner radius)
const FILLET = 14;      // S-curve fillet radius
const FLOOR_R = 14;     // rounded corner where the floor meets the right edge
const NARROW_W = 112;   // notch width on cards narrower than NARROW_MAX
const NARROW_H = 36;    // notch height on narrow cards
const NARROW_MAX = 300; // px

const ORANGE = "#FF6201";

/*
 * Card outline: a rounded rectangle whose top-right corner area (nw × nh)
 * is stepped down with an S-curve.
 *
 *   top edge → convex curve turning DOWN → short vertical →
 *   concave curve turning RIGHT → flat floor → rounded corner → right edge
 *
 * The area above the floor (right side) stays empty.
 */
function cardOutlinePath(W, H, b, nw, nh) {
  const x0 = b / 2;
  const y0 = b / 2;
  const x1 = W - b / 2;
  const y1 = H - b / 2;
  const r = NOTCH_R;
  const f = FILLET;
  const rt = FLOOR_R;

  return `M ${x0 + r} ${y0}
       H ${x1 - nw - r}
       A ${r} ${r} 0 0 1 ${x1 - nw} ${y0 + r}
       V ${y0 + nh - f}
       A ${f} ${f} 0 0 0 ${x1 - nw + f} ${y0 + nh}
       H ${x1 - rt}
       A ${rt} ${rt} 0 0 1 ${x1} ${y0 + nh + rt}
       V ${y1 - r}
       A ${r} ${r} 0 0 1 ${x1 - r} ${y1}
       H ${x0 + r}
       A ${r} ${r} 0 0 1 ${x0} ${y1 - r}
       V ${y0 + r}
       A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
}

/*
 * Outer edge of the card — same S-curve notch, but with NO stroke inset
 * (x0=0, y0=0, x1=W, y1=H). Used as the clip path so the PLUS orange fill
 * and the diagonal stripes can never stick out past the rounded outline,
 * including the notch tab's top-right corner.
 */
function cardOuterPath(W, H, nw, nh) {
  const x0 = 0;
  const y0 = 0;
  const x1 = W;
  const y1 = H;
  const r = NOTCH_R;
  const f = FILLET;
  const rt = FLOOR_R;

  return `M ${x0 + r} ${y0}
       H ${x1 - nw - r}
       A ${r} ${r} 0 0 1 ${x1 - nw} ${y0 + r}
       V ${y0 + nh - f}
       A ${f} ${f} 0 0 0 ${x1 - nw + f} ${y0 + nh}
       H ${x1 - rt}
       A ${rt} ${rt} 0 0 1 ${x1} ${y0 + nh + rt}
       V ${y1 - r}
       A ${r} ${r} 0 0 1 ${x1 - r} ${y1}
       H ${x0 + r}
       A ${r} ${r} 0 0 1 ${x0} ${y1 - r}
       V ${y0 + r}
       A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
}

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
  badgeLabel,
  badgeDot,
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

  const ref = useRef(null);
  const [size, setSize] = useState(null);
  const uid = useId().replace(/:/g, "");

  // Measure the card so the SVG outline can be built in real pixels.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev &&
        Math.abs(prev.w - rect.width) < 0.5 &&
        Math.abs(prev.h - rect.height) < 0.5
          ? prev
          : { w: rect.width, h: rect.height }
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const b = popular ? 2 : 1;
  const narrow = size !== null && size.w < NARROW_MAX;
  const nw = narrow ? NARROW_W : NOTCH_W;
  const nh = narrow ? NARROW_H : NOTCH_H;
  const measured = size !== null;

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={`course-card ${popular ? "course-card--popular" : ""} ${
        measured ? "course-card--notched" : "course-card--plain"
      }`}
      style={{
        "--notch-w": `${nw}px`,
        "--notch-h": `${nh}px`,
        "--notch-radius": `${NOTCH_R}px`,
      }}
    >
      {measured && (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            <pattern
              id={`notch-stripes-${uid}`}
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="10" height="10" fill={ORANGE} />
              <rect width="3" height="10" fill="rgba(255,255,255,0.25)" />
            </pattern>
            {/* Rounded-rect clip per card — this gives the notch its rounded
                outer corner. The orange fill and stripes are clipped to THIS,
                not to the S-curve path (whose fill area excludes the notch). */}
            <clipPath id={`plus-rect-${uid}`}>
              <rect x={0} y={0} width={size.w} height={size.h} rx={NOTCH_R} />
            </clipPath>
          </defs>

          {/* PLUS: orange rounded rect + diagonal stripes over the notch area.
              The white S-curve body below covers the card interior, so orange
              only shows in the notch. */}
          {popular && (
            <g clipPath={`url(#plus-rect-${uid})`}>
              <rect
                x={0}
                y={0}
                width={size.w}
                height={size.h}
                rx={NOTCH_R}
                fill={ORANGE}
              />
              <rect
                x={size.w - b / 2 - nw}
                y={0}
                width={nw}
                height={nh + FLOOR_R}
                fill={`url(#notch-stripes-${uid})`}
              />
            </g>
          )}

          {/* White body (inset S-curve path — the notch is outside it), then
              the coloured outline on top. */}
          <path
            d={cardOutlinePath(size.w, size.h, b, nw, nh)}
            className="course-card__body"
          />
          <path
            d={cardOutlinePath(size.w, size.h, b, nw, nh)}
            className="course-card__outline"
            strokeWidth={b}
          />
        </svg>
      )}

      {/* Free Pick & Drop marquee — PLUS Plan only */}
      {popular && (
        <div className="course-card__marquee">
          <div
            className="course-card__marquee-track flex w-max whitespace-nowrap animate-marquee"
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
        <div className="course-card__badge">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#FF6201]">
            <Sparkles size={10} />
            Most Popular
          </span>
        </div>
      )}

      <div className="course-card__content p-5">
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
        <div className="mt-3 flex items-baseline gap-2">
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
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5">
          <Clock3 size={14} className="shrink-0 text-[#FF6201]" />
          <span className="text-xs font-semibold text-gray-700">
            <span className="font-dm-sans">{durationNumber}</span> {durationUnit}
          </span>
        </div>

        {/* Features */}
        <ul className="mt-4 space-y-2">
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
        <div className="mt-4 border-t border-gray-100" />

        {/* CTA */}
        <button
          onClick={() => onBook?.({ course: name })}
          className={`btn-interactive mt-4 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-semibold transition-colors duration-200
            ${popular
              ? "bg-[#FF6201] text-white hover:bg-[#e55600]"
              : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
        >
          Book This Plan
        </button>
      </div>

      {/* Label inside the notch — real DOM text, driven by the badgeLabel prop */}
      {badgeLabel && (
        <div className="course-card__label">
          <span>{badgeLabel}</span>
          <span
            className="course-card__label-dot"
            style={{ background: popular ? "#FFFFFF" : badgeDot }}
          />
        </div>
      )}
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
