import { useState, useEffect } from "react";

import { fallbackReviews } from "../GoogleReviews/reviewsData";

function StarRow({ rating }) {
  return (
    <div className="flex gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="8"
          height="8"
          viewBox="0 0 20 20"
          fill={i <= rating ? "#FBBF24" : "#E5E7EB"}
        >
          <path d="M10 1.618l2.653 5.376 5.916.86-4.284 4.175 1.012 5.891L10 15.218l-5.297 2.782 1.012-5.891L1.431 7.854l5.916-.86z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const { name, rating, review: text, photoUrl } = review;
  const initial = (name || "U").charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      title={`${name}: ${text}`}
      style={{
        width: "1.5in",
        height: "0.78in",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "4px 6px",
        gap: "6px",
        flexShrink: 0,
      }}
    >
      {/* Profile photo or initial fallback */}
      <div
        style={{
          width: "0.38in",
          height: "0.38in",
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt=""
            width="0.38in"
            height="0.38in"
            onError={() => setImgError(true)}
            style={{ objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #FF3131, #FF6201)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Name + stars + one-line comment */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
        >
          {name}
        </p>
        <StarRow rating={rating} />
        <p
          style={{
            fontSize: "9px",
            color: "#374151",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: "1px",
            lineHeight: 1.2,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function ReviewWall() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("reviews fetch failed");
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data.reviews) ? data.reviews : [];
        if (list.length > 0) {
          setReviews(list.slice(0, 11));
        } else {
          // API returned successfully but with no reviews — use fallback
          setReviews(fallbackReviews.slice(0, 11));
        }
      } catch (_err) {
        // API unavailable — fall back to the 6 known real reviews
        if (!cancelled) setReviews(fallbackReviews.slice(0, 11));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews.length === 0) return null;

  // Rows of 3 (last row may have fewer)
  const rows = [];
  for (let i = 0; i < reviews.length; i += 3) {
    rows.push(reviews.slice(i, i + 3));
  }

  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "flex",
            gap: "6px",
            paddingLeft: rowIdx % 2 === 1 ? "0.75in" : "0px",
          }}
        >
          {row.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default ReviewWall;
