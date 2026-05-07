import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
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

function getFirstName(email: string): string {
  const prefix = email.split("@")[0];
  const name = prefix.split(/[._+]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export default async function DashboardPage() {
  // Layout already verified the JWT and redirected if invalid — safe to assert non-null.
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const session = (await verifyToken(token))!;

  const firstName = getFirstName(session.email);

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
