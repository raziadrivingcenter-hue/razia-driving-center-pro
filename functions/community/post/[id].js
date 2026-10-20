/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Server-rendered individual community   */
/*  post page.                                                         */
/*  Route: /community/post/:id                                         */
/*                                                                     */
/*  Returns complete, valid HTML for public posts so crawlers and AI   */
/*  engines can read the content before JavaScript executes. Uses the  */
/*  existing anon-key + PostgREST pattern (no service_role).           */
/* ------------------------------------------------------------------ */

const SITE_URL = "https://raziadrivingcenter.com";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Escape user-generated content for safe HTML insertion. */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Validate an image URL — only allow https or safe relative paths. */
function safeImageUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return null;
}

/* Derive a plain-text title from post content (no title column exists). */
function deriveTitle(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Community Post";
  return clean.length > 70 ? clean.slice(0, 67) + "..." : clean;
}

/* Derive a meta description from post content. */
function deriveDescription(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "A community post from Razia Driving Center, Lahore.";
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157) + "...";
}

/* Format a date for display (Asia/Karachi). */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;

  // CORS preflight (match existing function pattern)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const postId = params.id;

  // Validate UUID format — reject malformed IDs immediately
  if (!postId || !UUID_RE.test(postId)) {
    return new Response(
      render404("Invalid post ID"),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      render404("Service not configured"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    // Query the post with public author info (name + avatar_url only).
    // user_id is never selected or returned.
    const query =
      `${supabaseUrl}/rest/v1/posts?id=eq.${postId}` +
      `&select=id,text,image_url,created_at,profiles(name,avatar_url)`;

    const response = await fetch(query, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      console.error("Supabase error:", response.status, await response.text());
      return new Response(
        render404("Unable to load post"),
        { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const data = await response.json();

    // Missing post → real 404 (not a generic 200)
    if (!data || data.length === 0) {
      return new Response(
        render404("Post not found"),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const post = data[0];
    const author = post.profiles || {};
    const authorName = author.name || "Learner";
    const authorAvatar = safeImageUrl(author.avatar_url);
    const imageUrl = safeImageUrl(post.image_url);
    const canonical = `${SITE_URL}/community/post/${post.id}`;
    const title = deriveTitle(post.text);
    const description = deriveDescription(post.text);
    const dateStr = formatDate(post.created_at);

    // Build SocialMediaPosting structured data (accurate for this content)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SocialMediaPosting",
      headline: title,
      articleBody: post.text || "",
      author: {
        "@type": "Person",
        name: authorName,
      },
      datePublished: post.created_at || "",
      mainEntityOfPage: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: "Razia Driving Center",
        url: SITE_URL,
      },
    };

    const html = renderPage({
      title,
      description,
      canonical,
      post,
      authorName,
      authorAvatar,
      imageUrl,
      dateStr,
      structuredData,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Post function error:", error);
    return new Response(
      render404("Internal server error"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/* ── HTML renderers ─────────────────────────────────────────────── */

function renderPage({
  title,
  description,
  canonical,
  post,
  authorName,
  authorAvatar,
  imageUrl,
  dateStr,
  structuredData,
}) {
  const safeText = escapeHtml(post.text || "");
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeAuthor = escapeHtml(authorName);
  const safeDate = escapeHtml(dateStr);
  const safeImg = imageUrl ? escapeHtml(imageUrl) : null;
  const safeAvatar = authorAvatar ? escapeHtml(authorAvatar) : null;
  // JSON-LD lives in a <script> tag: do NOT entity-escape it (browsers
  // don't decode &quot; etc. inside <script>, so escapeHtml would produce
  // invalid JSON). Only guard against a </script> breakout from post text.
  const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Razia Driving Center</title>
  <meta name="description" content="${safeDesc}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${safeTitle} | Razia Driving Center">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Razia Driving Center">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${safeTitle} | Razia Driving Center">
  <meta name="twitter:description" content="${safeDesc}">
  <link rel="icon" href="/favicon-48.png?v=48" sizes="48x48">
  <link rel="icon" type="image/png" href="/favicon-48.png?v=48" sizes="48x48">
  <link rel="apple-touch-icon" href="/favicon-48.png?v=48" sizes="48x48">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;color:#1f2937;line-height:1.7;padding:2rem 1rem}
    .container{max-width:680px;margin:0 auto}
    .back-link{display:inline-flex;align-items:center;gap:.4rem;color:#FF6201;text-decoration:none;font-size:.875rem;font-weight:500;margin-bottom:1.5rem}
    .back-link:hover{text-decoration:underline}
    .card{background:#fff;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,.08);padding:2rem;overflow:hidden}
    .header{display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem}
    .avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0}
    .avatar-fallback{width:40px;height:40px;border-radius:50%;background:#fff7ed;color:#FF6201;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0}
    .author-name{font-size:.875rem;font-weight:600;color:#111827}
    .post-date{font-size:.75rem;color:#9ca3af}
    .post-text{white-space:pre-wrap;font-size:.9375rem;line-height:1.75;color:#374151;margin-bottom:1rem}
    .post-image{max-height:320px;width:100%;object-fit:cover;border-radius:.75rem;margin-top:.5rem}
    .brand{margin-top:2rem;text-align:center;font-size:.75rem;color:#9ca3af}
    .brand a{color:#FF6201;text-decoration:none}
  </style>
</head>
<body>
  <div class="container">
    <a href="/community/" class="back-link">&larr; Back to Community</a>
    <article class="card">
      <div class="header">
        ${safeAvatar ? `<img src="${safeAvatar}" alt="${safeAuthor}" class="avatar">` : `<div class="avatar-fallback">${escapeHtml(authorName.charAt(0).toUpperCase())}</div>`}
        <div>
          <p class="author-name">${safeAuthor}</p>
          ${safeDate ? `<p class="post-date">${safeDate}</p>` : ""}
        </div>
      </div>
      <p class="post-text">${safeText}</p>
      ${safeImg ? `<img src="${safeImg}" alt="Post image" class="post-image">` : ""}
    </article>
    <p class="brand"><a href="https://raziadrivingcenter.com/">Razia Driving Center</a> &mdash; Driving School in Gulberg 2, Lahore</p>
  </div>
</body>
</html>`;
}

function render404(message) {
  const safeMsg = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Not Found | Razia Driving Center</title>
  <meta name="robots" content="noindex">
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;color:#1f2937;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
    .box{text-align:center}
    h1{font-size:1.5rem;margin-bottom:.5rem}
    p{color:#6b7280;margin-bottom:1rem}
    a{color:#FF6201;text-decoration:none;font-weight:500}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="box">
    <h1>404 &mdash; Post Not Found</h1>
    <p>${safeMsg}</p>
    <a href="/community/">Back to Community</a>
  </div>
</body>
</html>`;
}
