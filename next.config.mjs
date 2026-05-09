import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "at-ease-tutoring",
  project: "prod",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through Next.js to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Disable automatic route-handler wrapping — next-on-pages cannot process
  // the duplicate identifiers Sentry injects during instrumentation.
  // Error capture is handled manually via instrumentation.ts + onRequestError.
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,

  // Remove Sentry logger statements from the bundle
  disableLogger: true,
});
