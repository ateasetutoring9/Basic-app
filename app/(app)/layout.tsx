import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";
import TopNav from "@/components/TopNav";
import { EmailVerificationBanner } from "./_components/EmailVerificationBanner";

export const runtime = "edge";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? null;
  const session = token ? await verifyToken(token) : null;

  if (!session) redirect("/login");

  // Bind user to Sentry scope — sync_id only, no email or PII
  Sentry.setUser({
    id: session.syncId,
    segment: session.isAdmin ? "admin" : "user",
  });

  // Fetch verification status for the banner — small query, cached by Supabase client
  const supabase = createServerClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("email_verified_at")
    .eq("id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  const isVerified = !!userRow?.email_verified_at;

  return (
    <>
      <EmailVerificationBanner isVerified={isVerified} />
      <TopNav />
      {children}
    </>
  );
}
