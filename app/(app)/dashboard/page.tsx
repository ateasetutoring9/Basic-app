import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";
import { Greeting } from "./_components/Greeting";
import {
  ContinueLearning,
  ContinueLearningSkeleton,
} from "./_components/ContinueLearning";
import { Recommended, RecommendedSkeleton } from "./_components/Recommended";
import { YourSubjects, YourSubjectsSkeleton } from "./_components/YourSubjects";
import {
  RecentActivity,
  RecentActivitySkeleton,
} from "./_components/RecentActivity";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — At Ease Learning",
};

export default async function DashboardPage() {
  // Layout already verified the JWT and redirected if invalid — safe to assert non-null.
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const session = (await verifyToken(token))!;

  const supabase = createServerClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", session.userId)
    .maybeSingle();

  // Use stored name; fall back to the email prefix for accounts created before this field existed
  const firstName = userRow?.display_name ?? session.email.split("@")[0];

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4">
        <Greeting firstName={firstName} />

        <Suspense fallback={<ContinueLearningSkeleton />}>
          <ContinueLearning userId={session.userId} />
        </Suspense>

        <Suspense fallback={<RecommendedSkeleton />}>
          <Recommended />
        </Suspense>

        <Suspense fallback={<YourSubjectsSkeleton />}>
          <YourSubjects userId={session.userId} />
        </Suspense>

        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivity userId={session.userId} />
        </Suspense>
      </div>
    </main>
  );
}
