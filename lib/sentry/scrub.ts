const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "passwordresettoken",
  "passwordresetexpiresat",
  "token",
  "authorization",
  "cookie",
  "session",
  "apikey",
  "secret",
];

export function scrubObject(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj == null) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => scrubObject(item, depth + 1));
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const normalised = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.some((s) => normalised.includes(s))) {
      cleaned[key] = "[REDACTED]";
    } else {
      cleaned[key] = scrubObject(value, depth + 1);
    }
  }
  return cleaned;
}
