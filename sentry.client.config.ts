import * as Sentry from "@sentry/nextjs";
import { beforeSend } from "@/lib/sentry/scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: false,

  ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],

  beforeSend,
});
