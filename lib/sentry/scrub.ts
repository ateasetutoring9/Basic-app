import type { ErrorEvent } from "@sentry/core";

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "token",
  "secret",
  "cookie",
  "authorization",
  "api_key",
  "apikey",
];

function redactKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p))) {
      out[k] = "[Filtered]";
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redactKeys(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const IGNORED_MESSAGES = new Set(["NEXT_REDIRECT", "NEXT_NOT_FOUND"]);
const IGNORED_STATUS_CODES = new Set([401, 403, 404, 429]);

export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  // Drop Next.js internal navigation/not-found throws
  const firstValue = event.exception?.values?.[0]?.value ?? "";
  if (IGNORED_MESSAGES.has(firstValue)) return null;

  // Drop intentional HTTP error responses
  const httpStatus = event.tags?.["http.status_code"];
  if (httpStatus !== undefined && IGNORED_STATUS_CODES.has(Number(httpStatus))) return null;

  // Scrub request body, headers, and cookies
  if (event.request) {
    if (event.request.cookies !== undefined) {
      (event.request as { cookies: unknown }).cookies = "[Filtered]";
    }
    if (event.request.headers && typeof event.request.headers === "object") {
      event.request.headers = redactKeys(
        event.request.headers as Record<string, unknown>
      ) as Record<string, string>;
    }
    if (event.request.data && typeof event.request.data === "object") {
      event.request.data = redactKeys(
        event.request.data as Record<string, unknown>
      );
    }
  }

  // Scrub arbitrary extra context
  if (event.extra && typeof event.extra === "object") {
    event.extra = redactKeys(event.extra as Record<string, unknown>);
  }

  return event;
}
