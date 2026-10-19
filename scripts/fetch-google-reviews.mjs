/* ------------------------------------------------------------------ */
/*  Fetch latest 20 Google Business Profile reviews + profile photos
/*  and store them locally so the site never calls the Google API
/*  (and never consumes refresh-token quota) again.
/*
/*  Run locally with Cloudflare secret values set as env vars:
/*    GBP_CLIENT_ID=... GBP_CLIENT_SECRET=... GBP_REFRESH_TOKEN=... \
/*    GBP_ACCOUNT_ID=... GBP_LOCATION_ID=... \
/*    node scripts/fetch-google-reviews.mjs */
/*
/*  Output:
/*    public/reviews/photos/<id>.<ext> — profile pictures
/*    src/data/cached-reviews.json     — normalized review data
/* ------------------------------------------------------------------ */

import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_REVIEWS_URL =
  "https://mybusiness.googleapis.com/v4" +
  "/accounts/{accountId}/locations/{locationId}/reviews";

const TARGET_COUNT = 20;
const PHOTO_DIR = resolve(ROOT, "public/reviews/photos");
const OUT_JSON = resolve(ROOT, "src/data/cached-reviews.json");

const RATING_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error("Missing env var: " + name);
  return v;
}

async function refreshAccessToken() {
  const params = new URLSearchParams({
    client_id: env("GBP_CLIENT_ID"),
    client_secret: env("GBP_CLIENT_SECRET"),
    refresh_token: env("GBP_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Token refresh failed: " + res.status);
  const data = await res.json();
  return data.access_token;
}

async function fetchReviews(accessToken) {
  const url = GBP_REVIEWS_URL
    .replace("{accountId}", env("GBP_ACCOUNT_ID"))
    .replace("{locationId}", env("GBP_LOCATION_ID"));

  const all = [];
  let pageToken = undefined;

  while (all.length < TARGET_COUNT) {
    const query = `pageSize=20&orderBy=updateTime desc` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const res = await fetch(`${url}?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Reviews fetch failed: " + res.status);
    const data = await res.json();
    if (data.reviews?.length) all.push(...data.reviews);
    pageToken = data.nextPageToken || undefined;
    if (!pageToken) break;
  }

  return all.slice(0, TARGET_COUNT);
}

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function downloadPhoto(photoUrl, destPath) {
  try {
    const res = await fetch(photoUrl);
    if (!res.ok) throw new Error("photo fetch " + res.status);
    const ct = res.headers.get("content-type") || "";
    const ext = EXT_BY_MIME[ct.split(";")[0].trim().toLowerCase()] || ".jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    // Swap extension if content-type disagrees with default .jpg
    const finalPath = destPath.replace(/\.jpg$/, ext);
    await writeFile(finalPath, buf);
    return finalPath;
  } catch (err) {
    console.warn("  photo download failed:", err.message);
    return null;
  }
}

async function main() {
  console.log("Fetching access token...");
  const token = await refreshAccessToken();
  console.log("OK");

  console.log("Fetching reviews...");
  const raw = await fetchReviews(token);
  console.log(`Got ${raw.length} reviews`);

  await mkdir(PHOTO_DIR, { recursive: true });

  const reviews = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const id = String(i + 1);
    const photoUrl = r.reviewer?.profilePhotoUrl || null;
    let localPhoto = null;

    if (photoUrl) {
      const dest = resolve(PHOTO_DIR, `${id}.jpg`);
      const savedPath = await downloadPhoto(photoUrl, dest);
      if (savedPath) localPhoto = `/reviews/photos/${basename(savedPath)}`;
      console.log(`  [${id}] ${r.reviewer?.displayName} — photo ${savedPath ? "saved" : "failed"}`);
    } else {
      console.log(`  [${id}] ${r.reviewer?.displayName} — no photo`);
    }

    reviews.push({
      id,
      name: r.reviewer?.displayName || "Google User",
      rating: RATING_MAP[r.starRating] || 5,
      time: r.createTime,
      review: r.comment || "",
      photo: localPhoto,
    });
  }

  const output = { generated: new Date().toISOString(), reviews };
  await writeFile(OUT_JSON, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${reviews.length} reviews to ${OUT_JSON}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
