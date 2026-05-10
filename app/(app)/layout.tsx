import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import TopNav from "@/components/TopNav";

export const runtime = 'edge';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? null;
  const session = token ? await verifyToken(token) : null;

  if (!session) redirect("/login");

  // Bind user to Sentry scope — sync_id only, no email or PII
  Sentry.setUser({
    id: session.syncId,
    segment: session.isAdmin ? "admin" : "user",
  });

  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
