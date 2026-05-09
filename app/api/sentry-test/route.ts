import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "edge";

// Verify Sentry integration is working. Remove once confirmed.
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  throw new Error(`Sentry test error (triggered by ${auth.email})`);
}
