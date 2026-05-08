import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";

export interface AdminSession {
  userId: number;
  syncId: string;
  email: string;
}

export async function requireAdmin(): Promise<AdminSession | Response> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session?.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.userId, syncId: session.syncId, email: session.email };
}
