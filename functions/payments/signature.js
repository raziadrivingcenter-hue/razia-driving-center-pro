/* ------------------------------------------------------------------ */
/*  Webhook signature helpers — shared by every gateway adapter.       */
/*                                                                    */
/*  Built on Web Crypto (crypto.subtle), which exists in Cloudflare    */
/*  Pages Functions and in Node 18+. No new dependency, no npm crypto. */
/*                                                                    */
/*  Every adapter verifies a gateway signature over the RAW request    */
/*  body. Parsing the body first and signing the re-serialized JSON   */
/*  is the classic way to get a verification bypass, so the pipeline   */
/*  hands adapters the exact bytes and never a parsed object.          */
/* ------------------------------------------------------------------ */

const encoder = new TextEncoder();

/** @returns {Promise<Uint8Array>} raw HMAC-SHA256 bytes */
export async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(secret ?? "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(String(message ?? ""))
  );
  return new Uint8Array(digest);
}

export async function hmacSha256Hex(secret, message) {
  const bytes = await hmacSha256(secret, message);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSha256Base64(secret, message) {
  const bytes = await hmacSha256(secret, message);
  // btoa exists in Workers and in Node 16+. Buffer is the fallback for very
  // old Node test runners.
  if (typeof btoa === "function") {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

/**
 * Length-check then constant-time compare. A plain `===` short-circuits on
 * the first differing character, which leaks timing information an attacker
 * can use to forge a signature one byte at a time.
 */
export function safeEqual(a, b) {
  const left = String(a ?? "");
  const right = String(b ?? "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify an expected signature against a secret. `encoding` is adapter-owned
 * because gateways disagree: some send hex, some base64, some base64 of a
 * different digest. Keeping the decoding here means adapters never hand-roll
 * comparison logic.
 *
 * @returns {Promise<boolean>}
 */
export async function verifyHmacSignature({
  secret,
  message,
  signature,
  encoding = "hex",
}) {
  if (!secret || !signature) return false;
  const expected =
    encoding === "base64"
      ? await hmacSha256Base64(secret, message)
      : await hmacSha256Hex(secret, message);
  return safeEqual(signature, expected);
}
