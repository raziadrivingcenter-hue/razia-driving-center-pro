/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Dynamic community post sitemap.        */
/*  File path → route: /community-sitemap.xml                          */
/*                                                                     */
/*  Lists all publicly readable community posts. Since the posts       */
/*  table has no moderation/visibility column and RLS SELECT is        */
/*  USING (true), every existing post is publicly readable.            */
/*  Handles empty results and API errors safely.                       */
/* ------------------------------------------------------------------ */

const SITE_URL = "https://raziadrivingcenter.com";

function escapeXml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
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

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  let posts = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Fetch all public posts (id + last modified date).
      // user_id is never selected — only the public post URL is exposed.
      const query =
        `${supabaseUrl}/rest/v1/posts` +
        `?select=id,created_at` +
        `&order=created_at.desc` +
        `&limit=5000`;

      const response = await fetch(query, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Sitemap Supabase error:",
          response.status,
          await response.text()
        );
        // On API error, return a valid empty sitemap (not a 500)
        posts = [];
      } else {
        const data = await response.json();
        posts = Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error("Sitemap function error:", error);
      posts = [];
    }
  }

  // Build XML — always valid even when empty
  const urls = posts
    .map((p) => {
      const loc = `${SITE_URL}/community/post/${p.id}`;
      const lastmod = p.created_at
        ? new Date(p.created_at).toISOString().split("T")[0]
        : null;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""}    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
