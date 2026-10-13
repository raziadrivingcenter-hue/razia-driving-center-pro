/**
 * cn() — Merge Tailwind classes intelligently.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Lightweight zero-dependency version.
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object" && !Array.isArray(input)) {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    } else if (Array.isArray(input)) {
      classes.push(...input.filter(Boolean));
    }
  }

  // Simple deduplication — last occurrence wins (Tailwind convention)
  const seen = new Set();
  const result = [];

  for (const cls of classes.join(" ").split(/\s+/).filter(Boolean)) {
    if (!seen.has(cls)) {
      seen.add(cls);
      result.push(cls);
    }
  }

  return result.join(" ");
}
