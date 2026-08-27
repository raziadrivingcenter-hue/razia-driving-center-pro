// Background gradients + text colors for the three pricing-card variants.
// Kept in a shared data file so the card component stays presentational.

export const variantConfig = {
  silver: {
    bg: "linear-gradient(135deg, #E8E8E8, #D3D3D3)",
    text: "#3a3a3a",
    subtext: "#6b6b6b",
    oldPrice: "#9a9a9a",
    border: "#b0b0b0",
  },
  gold: {
    bg: "linear-gradient(135deg, #E8C547, #D4A028)",
    text: "#3d2e0a",
    subtext: "#6b5a2a",
    oldPrice: "#8a7a4a",
    border: "#b08a1a",
  },
  yellow: {
    bg: "linear-gradient(135deg, #FFE066, #F4D03F)",
    text: "#3d2e0a",
    subtext: "#6b5a2a",
    oldPrice: "#9a8a3a",
    border: "#c4a82a",
  },
};

// Map each course (by its data `title`) to a card variant.
export const courseVariantMap = {
  "Basic Plan": "silver",
  "PLUS Plan": "silver",
  "PRO+ Plan": "gold",
};
