import Link from "next/link";
import { getRecentAttempts } from "../_lib/loaders";
import type { RecentAttempt } from "../_lib/types";

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function RecentActivitySkeleton() {
  return (
    <section className="mb-12 md:mb-16">
      <div className="h-6 bg-gray-100 rounded w-36 mb-4 animate-pulse" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
        ))}
      </div>
    </section>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AttemptRow({ attempt }: { attempt: RecentAttempt }) {
  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const scoreClass =
    pct >= 80 ? "text-green-700" : pct >= 50 ? "text-indigo-700" : "text-amber-700";

  return (
    <li className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-fg leading-snug min-w-0 truncate">
        <span className="text-muted">{attempt.subjectName} &middot;</span>{" "}
        {attempt.topicTitle}
      </span>
      <span className="shrink-0 flex items-center gap-3 text-sm">
        <span className={`font-semibold ${scoreClass}`}>
          {attempt.score}/{attempt.total}
        </span>
        <span className="text-muted hidden sm:inline">{relativeTime(attempt.createdAt)}</span>
      </span>
    </li>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export async function RecentActivity({ userId }: { userId: number }) {
  let attempts: RecentAttempt[] = [];
  try {
    attempts = await getRecentAttempts(userId, 3);
  } catch {
    return null;
  }

  // Hide entirely if the user has no attempts yet
  if (!attempts.length) return null;

  return (
    <section className="mb-12 md:mb-16">
      <h2 className="text-xl font-bold text-fg mb-4">Recent activity</h2>
      <ul className="rounded-xl border border-border bg-white px-5 divide-y divide-border">
        {attempts.map((a) => (
          <AttemptRow key={a.attemptId} attempt={a} />
        ))}
      </ul>
      <div className="mt-3">
        <Link
          href="/progress"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          View all progress &rarr;
        </Link>
      </div>
    </section>
  );
}
