import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";
import { getRecentLoginAttempts } from "./_lib/loaders";
import { PageContainer } from "@/components/ui/PageContainer";
import { EmailStatusSection } from "./_components/EmailStatusSection";
import type { LoginOutcome } from "@/lib/auth/log-login-attempt";

export const runtime = "edge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAttemptTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OUTCOME_LABEL: Record<LoginOutcome, string> = {
  success: "Signed in",
  wrong_password: "Failed sign-in",
  user_not_found: "Failed sign-in",
  account_locked: "Blocked — too many attempts",
  email_not_verified: "Blocked — email not verified",
  rate_limited: "Blocked — too many requests",
  error: "Sign-in error",
};

function OutcomeDot({ outcome }: { outcome: LoginOutcome }) {
  if (outcome === "success") {
    return (
      <span
        className="block w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 mt-1"
        aria-hidden="true"
      />
    );
  }
  if (outcome === "error") return null;
  return (
    <span
      className="block w-1.5 h-1.5 rounded-full bg-error flex-shrink-0 mt-1"
      aria-hidden="true"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SecurityPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) redirect("/login");

  const supabase = createServerClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("email, email_verified_at")
    .eq("id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  const attempts = await getRecentLoginAttempts(session.userId);

  return (
    <PageContainer as="main">
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-small text-muted mb-6 flex items-center gap-1.5">
          <Link href="/settings" className="hover:text-fg transition-colors">
            Settings
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-fg font-medium">Security</span>
        </nav>

        {/* Email verification status */}
        <EmailStatusSection
          email={userRow?.email ?? session.email}
          isVerified={!!userRow?.email_verified_at}
        />

        <h1 className="text-page-title text-fg mb-1">Recent activity</h1>
        <p className="text-small text-muted mb-8 leading-relaxed">
          The last 20 sign-in attempts on your account. If you see anything you
          don&apos;t recognise,{" "}
          <Link
            href="/forgot-password"
            className="text-accent underline hover:no-underline"
          >
            reset your password
          </Link>{" "}
          and contact us.
        </p>

        {attempts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
            <p className="text-small text-muted">No sign-in activity yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {attempts.map((attempt, idx) => (
              <div
                key={attempt.syncId}
                className={`px-6 py-4 flex items-start justify-between gap-6 ${
                  idx < attempts.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {/* Left: outcome + time */}
                <div className="flex items-start gap-2 min-w-0">
                  <OutcomeDot outcome={attempt.outcome} />
                  <div className="min-w-0">
                    <p
                      className={`text-small font-medium leading-snug ${
                        attempt.outcome === "success" ? "text-fg" : "text-muted"
                      }`}
                    >
                      {OUTCOME_LABEL[attempt.outcome]}
                    </p>
                    <p className="text-[0.75rem] text-[var(--text-tertiary)] mt-0.5">
                      {formatAttemptTime(attempt.attemptedAt)}
                    </p>
                  </div>
                </div>

                {/* Right: device + IP */}
                <div className="text-right flex-shrink-0">
                  <p className="text-small text-muted">
                    {attempt.device.browser} on {attempt.device.os}
                  </p>
                  <p className="text-[0.75rem] text-[var(--text-tertiary)] mt-0.5">
                    IP {attempt.ipMasked}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
