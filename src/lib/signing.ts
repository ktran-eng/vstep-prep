/** HMAC-SHA256 signing with Web Crypto — usable from both the proxy and Node server code. */
const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

/**
 * SESSION_SECRET if set; otherwise a key derived from DATABASE_URL, which is already a server-only secret
 * (anyone holding it could read the data the cookie protects). Changing the database password logs learners
 * out, which only means typing their sign-in name again.
 */
export function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.DATABASE_URL) return `vstep-session-v1|${process.env.DATABASE_URL}`;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (>= 32 chars) or DATABASE_URL is required in production.");
  return "dev-only-insecure-session-secret-change-me";
}

export async function sign(value: string, secret = getSessionSecret()): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(value));
  return `${value}.${b64url(mac)}`;
}

/** Returns the original value if the signature is valid, otherwise null. Constant-time comparison. */
export async function verify(signed: string | undefined | null, secret?: string): Promise<string | null> {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const expected = await sign(value, secret ?? getSessionSecret());
  if (expected.length !== signed.length) return null;
  let diff = 0;
  for (let j = 0; j < expected.length; j++) diff |= expected.charCodeAt(j) ^ signed.charCodeAt(j);
  return diff === 0 ? value : null;
}

export const LEARNER_COOKIE = "vstep_lid";
export const ADMIN_COOKIE = "vstep_admin";
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
