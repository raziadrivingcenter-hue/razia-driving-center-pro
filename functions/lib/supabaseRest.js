/* ------------------------------------------------------------------ */
/*  Small service-role REST client for the Cloudflare Pages Functions. */
/*                                                                    */
/*  Uses SUPABASE_SERVICE_ROLE_KEY, which is a server-only env var (no  */
/*  VITE_ prefix) and never reaches the browser. Every caller fails     */
/*  closed when the key is missing.                                    */
/* ------------------------------------------------------------------ */

export function getServiceRoleClient(env) {
  const url = String(env?.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(env?.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !key) return null;

  const headers = (extra = {}) => ({
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  });

  return {
    url,
    key,

    /** GET a PostgREST resource path. */
    async get(path, prefer) {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        method: "GET",
        headers: headers(prefer ? { Prefer: prefer } : undefined),
      });
      if (!res.ok) {
        const body = await res.text();
        const err = new Error(`Supabase GET failed: ${res.status} ${body}`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    },

    /**
     * POST a row. `prefer` controls PostgREST's Prefer header
     * (e.g. "return=representation", "resolution=ignore-duplicates").
     */
    async post(path, body, prefer) {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        method: "POST",
        headers: headers(prefer ? { Prefer: prefer } : undefined),
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      if (!res.ok) {
        const err = new Error(`Supabase POST failed: ${res.status} ${text}`);
        err.status = res.status;
        err.body = parsed;
        throw err;
      }
      return parsed;
    },

    /** PATCH rows matching a PostgREST filter. */
    async patch(path, body, prefer) {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        method: "PATCH",
        headers: headers(prefer ? { Prefer: prefer } : undefined),
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        const err = new Error(`Supabase PATCH failed: ${res.status} ${text}`);
        err.status = res.status;
        throw err;
      }
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    },

    /** Call a SECURITY DEFINER RPC. */
    async rpc(name, payload, prefer) {
      const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: headers(prefer ? { Prefer: prefer } : undefined),
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        const err = new Error(`Supabase RPC ${name} failed: ${res.status} ${text}`);
        err.status = res.status;
        err.body = text;
        throw err;
      }
      // PostgREST returns a scalar uuid as a quoted JSON string.
      return text.trim().replace(/^"|"$/g, "");
    },
  };
}
