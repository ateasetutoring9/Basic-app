import * as Sentry from "@sentry/nextjs";
import { scrubObject } from "@/lib/sentry/scrub";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  beforeSend(event, hint) {
    if (event.request) {
      if (event.request.data) event.request.data = scrubObject(event.request.data);
      if (event.request.headers) event.request.headers = scrubObject(event.request.headers) as Record<string, string>;
      if (event.request.cookies) event.request.cookies = Object.fromEntries(Object.keys(event.request.cookies).map((k) => [k, "[REDACTED]"]));
    }
    if (event.extra) event.extra = scrubObject(event.extra) as Record<string, unknown>;

    const error = hint?.originalException;
    if (error instanceof Error) {
      if (["NEXT_REDIRECT", "NEXT_NOT_FOUND"].some((m) => error.message?.includes(m))) return null;
    }

    if (event.tags?.["http.status_code"]) {
      const status = Number(event.tags["http.status_code"]);
      if ([401, 403, 404, 429].includes(status)) return null;
    }

    return event;
  },

  ignoreErrors: [
    "Invalid credentials",
    "Token expired",
    "Unauthorized",
  ],
});
