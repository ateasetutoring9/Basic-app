// Edge-compatible token utilities using Web Crypto (no Node.js crypto module).
// Used by password reset and email verification.

export async function generateToken(): Promise<{ raw: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const hash = await hashToken(raw);
  return { raw, hash };
}

export async function hashToken(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
