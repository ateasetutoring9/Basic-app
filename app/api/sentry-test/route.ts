export const runtime = "edge";
export const dynamic = "force-dynamic";

// Hit GET /api/sentry-test to verify Sentry captures errors end-to-end.
// Remove or gate behind a secret before public launch.
export async function GET() {
  throw new Error("Sentry test error — this should appear in the Sentry dashboard");
}
