import { useEffect } from "react";

const DEFAULT_META = {
  title: "Razia Driving Center | Driving School in Gulberg 2, Lahore",
  description:
    "Razia Driving Center is a driving school in Gulberg 2, Lahore offering one-to-one driving lessons with an experienced female instructor. Rated 5.0 from 147 Google reviews. Established 2016.",
  canonical: "https://raziadrivingcenter.com/",
};

// Homepage share image from index.html — restored on unmount so a page that
// sets its own image does not leak it onto every other route.
const DEFAULT_IMAGE = {
  url: "https://raziadrivingcenter.com/og-image-v2.png",
  type: "image/png",
  width: "1200",
  height: "630",
  alt: "Razia Driving Center - Book your driving lesson slot online in Gulberg 2, Lahore",
  card: "summary_large_image",
};

function setMeta(name, content, isProperty = false) {
  if (!content) return;
  const selector = isProperty
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Open Graph + Twitter image tags. Only pages that pass `image` touch these,
// so every existing caller keeps the homepage image it already had.
function setImageMeta(image) {
  setMeta("og:image", image.url, true);
  setMeta("og:image:secure_url", image.url, true);
  setMeta("og:image:type", image.type, true);
  setMeta("og:image:width", image.width, true);
  setMeta("og:image:height", image.height, true);
  setMeta("og:image:alt", image.alt, true);
  setMeta("twitter:image", image.url);
  setMeta("twitter:card", image.card);
}

export function useMeta({ title, description, canonical, image }) {
  useEffect(() => {
    document.title = title || DEFAULT_META.title;

    setMeta("description", description || DEFAULT_META.description);
    setMeta("og:title", title || DEFAULT_META.title, true);
    setMeta("og:description", description || DEFAULT_META.description, true);
    setMeta("og:url", canonical || DEFAULT_META.canonical, true);
    setMeta("twitter:title", title || DEFAULT_META.title);
    setMeta("twitter:description", description || DEFAULT_META.description);

    setCanonical(canonical || DEFAULT_META.canonical);

    // No image passed → leave the static HTML's og:image untouched.
    if (image) setImageMeta(image);

    return () => {
      document.title = DEFAULT_META.title;
      setMeta("description", DEFAULT_META.description);
      setMeta("og:title", DEFAULT_META.title, true);
      setMeta("og:description", DEFAULT_META.description, true);
      setMeta("og:url", DEFAULT_META.canonical, true);
      setMeta("twitter:title", DEFAULT_META.title);
      setMeta("twitter:description", DEFAULT_META.description);
      setCanonical(DEFAULT_META.canonical);
      setImageMeta(DEFAULT_IMAGE);
    };
  }, [title, description, canonical, image]);
}
