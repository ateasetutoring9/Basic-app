import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import TopNav from "@/components/TopNav";

export const runtime = 'edge';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value ?? null;
  const session = token ? await verifyToken(token) : null;

  if (!session) redirect("/login");

  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
