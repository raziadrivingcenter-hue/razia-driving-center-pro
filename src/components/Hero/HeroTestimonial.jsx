/* ------------------------------------------------------------------ */
/*  HeroTestimonial — a 3D flipping card that auto-cycles through
/*  real student reviews. front/back faces use preserve-3d + backface-
/*  hidden so the card rotates cleanly between testimonials.
/*  Respects prefers-reduced-motion (shows static first review).
/* ------------------------------------------------------------------ */
import { useState, useEffect } from "react";
import { motion, useAnimate } from "framer-motion";
import { Star, BadgeCheck } from "lucide-react";
import cachedReviews from "../../data/cached-reviews.json";

const CYCLE_MS = 4500;
const FLIP_MS = 700;

const reviews = cachedReviews.reviews.map((r) => ({
  name: r.name,
  text: r.review,
  photo: r.photo,
  time: r.time ? relativeTime(r.time) : "",
}));

function relativeTime(iso) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const d = Math.floor((now - then) / 86400000);
  if (d < 1) return "Recently";
  if (d < 30) return d + (d === 1 ? " day ago" : " days ago");
  const m = Math.floor(d / 30);
  if (m < 12) return m + (m === 1 ? " month ago" : " months ago");
  const y = Math.floor(m / 12);
  return y + (y === 1 ? " year ago" : " years ago");
}

function ReviewFace({ review, side }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 shadow-lg ring-1 ring-gray-100"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : "rotateY(0deg)",
      }}
    >
      {/* Stars */}
      <div className="flex shrink-0 gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Quote — clamped to 3 lines so long reviews stay inside the card */}
      <p className="mt-3 flex-1 overflow-hidden text-[13px] leading-relaxed text-gray-600"
        style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
      >
        {review.text
          ? "“" + review.text + "”"
          : "★ 5-star review"}
      </p>

      {/* Author */}
      <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-gray-100 pt-3">
        {review.photo ? (
          <img
            src={review.photo}
            alt={review.name}
            loading="lazy"
            decoding="async"
            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-100"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-[12px] font-bold text-[#FF6201]">
            {review.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="flex items-center gap-1 text-[12px] font-semibold text-gray-900">
            {review.name}
            <BadgeCheck size={12} className="text-blue-500" />
          </p>
          {review.time && (
            <p className="text-[10px] text-gray-400">{review.time}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeroTestimonial() {
  const [index, setIndex] = useState(0);
  const [scope, animate] = useAnimate();
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Listen for live changes (e.g. OS toggle)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-flip cycle
  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(async () => {
      // Flip current front → back (0 → 180)
      await animate(
        scope.current,
        { rotateY: 180 },
        { duration: FLIP_MS / 1000, ease: "easeInOut" }
      );
      // Swap to next review, instant reset to 0 (no animation — invisible)
      setIndex((prev) => (prev + 1) % reviews.length);
      await animate(
        scope.current,
        { rotateY: 0 },
        { duration: 0 }
      );
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, [animate, scope, reducedMotion]);

  const current = reviews[index];
  const next = reviews[(index + 1) % reviews.length];

  return (
    <div
      className="relative hidden h-[240px] w-full max-w-[340px] lg:block"
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={scope}
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateY: 0 }}
      >
        <ReviewFace review={current} side="front" />
        <ReviewFace review={next} side="back" />
      </motion.div>

      {/* Progress dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {reviews.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-[#FF6201]" : "w-1 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
