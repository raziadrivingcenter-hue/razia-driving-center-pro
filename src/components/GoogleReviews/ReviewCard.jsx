import { useState } from "react";
import googleLogo from "../../assets/google-logo.png";

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
  className="
    review-card
    group
    rounded-3xl
    border
    border-gray-200
    bg-white
    p-7
    shadow-lg
    transition-all
    duration-500
    hover:-translate-y-2
    hover:shadow-2xl
  "
>
      {/* Top */}

      <div className="flex items-center justify-between">

        <img
          src={googleLogo}
          alt="Google"
          className="
            h-8
            w-8
            transition-transform
            duration-300
            group-hover:rotate-6
          "
        />

        <div className="text-xl tracking-wide text-yellow-500">
          ★★★★★
        </div>

      </div>

      {/* Profile */}

      <div className="mt-6 flex items-center gap-4">

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            text-xl
            font-bold
            text-white
          "
        >
          {review.name.charAt(0)}
        </div>

        <div>

          <h3 className="text-lg font-bold text-gray-900">
            {review.name}
          </h3>

          <p className="text-sm text-gray-500">
            {review.time}
          </p>

        </div>

      </div>

      {/* Verified Badge */}

      {review.verified && (

        <div
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-green-100
            px-4
            py-2
            text-sm
            font-semibold
            text-green-700
          "
        >
          ✔ Verified Google Review
        </div>

      )}

      {/* Review */}

      <p className="mt-6 leading-8 text-gray-600">

        {expanded
          ? review.review
          : `${review.review.substring(0, 130)}...`}

      </p>

      {/* Read More */}

      <button
        onClick={() => setExpanded(!expanded)}
        className="
          mt-5
          font-semibold
          text-[#FF6201]
          transition-colors
          duration-300
          hover:text-[#FF3131]
        "
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </div>
  );
}

export default ReviewCard;