import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import type { SessionPayload } from "@/lib/auth/jwt";

export async function requireAuth(): Promise<SessionPayload | Response> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
