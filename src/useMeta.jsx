import { useEffect } from "react";

const DEFAULT_META = {
  title: "Razia Driving Center | Driving School in Gulberg 2, Lahore",
  description:
    "Razia Driving Center is a driving school in Gulberg 2, Lahore offering one-to-one driving lessons with an experienced female instructor. Rated 5.0 from 133 Google reviews. Established 2016.",
  canonical: "https://raziadrivingcenter.com/",
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

export function useMeta({ title, description, canonical }) {
  useEffect(() => {
    document.title = title || DEFAULT_META.title;

    setMeta("description", description || DEFAULT_META.description);
    setMeta("og:title", title || DEFAULT_META.title, true);
    setMeta("og:description", description || DEFAULT_META.description, true);
    setMeta("og:url", canonical || DEFAULT_META.canonical, true);
    setMeta("twitter:title", title || DEFAULT_META.title);
    setMeta("twitter:description", description || DEFAULT_META.description);

    setCanonical(canonical || DEFAULT_META.canonical);

    return () => {
      document.title = DEFAULT_META.title;
      setMeta("description", DEFAULT_META.description);
      setMeta("og:title", DEFAULT_META.title, true);
      setMeta("og:description", DEFAULT_META.description, true);
      setMeta("og:url", DEFAULT_META.canonical, true);
      setMeta("twitter:title", DEFAULT_META.title);
      setMeta("twitter:description", DEFAULT_META.description);
      setCanonical(DEFAULT_META.canonical);
    };
  }, [title, description, canonical]);
}
