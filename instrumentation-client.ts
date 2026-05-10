import * as Sentry from "@sentry/nextjs";
import { scrubObject } from "@/lib/sentry/scrub";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Proxy events through our own domain to bypass ad blockers
  tunnel: "/monitoring",

  // Session replay disabled — privacy concerns with under-18 users
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend(event, hint) {
    if (event.request) {
      if (event.request.data) event.request.data = scrubObject(event.request.data);
      if (event.request.headers) event.request.headers = scrubObject(event.request.headers) as Record<string, string>;
      if (event.request.cookies) event.request.cookies = Object.fromEntries(Object.keys(event.request.cookies).map((k) => [k, "[REDACTED]"]));
    }
    if (event.extra) event.extra = scrubObject(event.extra) as Record<string, unknown>;
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => ({
        ...b,
        data: b.data ? (scrubObject(b.data) as Record<string, unknown>) : undefined,
      }));
    }

    const error = hint?.originalException;
    if (error instanceof Error) {
      if (["NEXT_REDIRECT", "NEXT_NOT_FOUND"].some((m) => error.message?.includes(m))) return null;
    }

    return event;
  },

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "Invalid credentials",
    "Token expired",
    "Unauthorized",
  ],
});
