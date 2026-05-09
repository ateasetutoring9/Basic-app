import { SignJWT, jwtVerify } from "jose";
import { createServerClient } from "@/lib/supabase/server";

export interface SessionPayload {
  userId: number;
  syncId: string;
  email: string;
  isAdmin: boolean;
}

function secret() {
  const key = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  return new TextEncoder().encode(key);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const session = payload as unknown as SessionPayload & { iat?: number };

    // Invalidate JWTs issued before the last password change
    if (session.userId && session.iat) {
      const supabase = createServerClient();
      const { data: user } = await supabase
        .from("users")
        .select("password_changed_at")
        .eq("id", session.userId)
        .is("deleted_at", null)
        .maybeSingle();

      if (user?.password_changed_at) {
        const changedAt = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
        if (session.iat < changedAt) return null;
      }
    }

    return session;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "session";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
