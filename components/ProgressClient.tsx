"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/ui/PageContainer";

// ─── Subject display names ────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  "social-studies": "Social Studies",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttemptRow {
  id: string;
  score: number;
  total: number;
  created_at: string;
  worksheets: {
    id: string;
    title: string;
    topics: {
      subject_slug: string;
      year_level: number;
      slug: string;
      title: string;
    } | null;
  } | null;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function calcStreak(attempts: AttemptRow[]): number {
  if (attempts.length === 0) return 0;

  const days = Array.from(
    new Set(attempts.map((a) => a.created_at.slice(0, 10)))
  ).sort((a, b) => (a > b ? -1 : 1));

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (days[0] !== todayStr && days[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

interface TopicSummary {
  topicSlug: string;
  title: string;
  attemptCount: number;
  bestPct: number;
  latestPct: number;
}
interface YearGroup { year: number; topics: TopicSummary[] }
interface SubjectGroup { subject: string; label: string; years: YearGroup[] }

function buildGroups(attempts: AttemptRow[]): SubjectGroup[] {
  const summaryMap = new Map<string, TopicSummary & { subject: string; year: number }>();

  for (const a of attempts) {
    const topic = a.worksheets?.topics;
    if (!topic) continue;
    const key = `${topic.subject_slug}/${topic.year_level}/${topic.slug}`;
    const pct = Math.round((a.score / a.total) * 100);
    const existing = summaryMap.get(key);
    if (!existing) {
      summaryMap.set(key, {
        subject: topic.subject_slug,
        year: topic.year_level,
        topicSlug: topic.slug,
        title: topic.title,
        attemptCount: 1,
        bestPct: pct,
        latestPct: pct,
      });
    } else {
      existing.attemptCount++;
      if (pct > existing.bestPct) existing.bestPct = pct;
    }
  }

  const subjectMap = new Map<string, Map<number, TopicSummary[]>>();
  for (const s of Array.from(summaryMap.values())) {
    if (!subjectMap.has(s.subject)) subjectMap.set(s.subject, new Map());
    const ym = subjectMap.get(s.subject)!;
    if (!ym.has(s.year)) ym.set(s.year, []);
    ym.get(s.year)!.push({ topicSlug: s.topicSlug, title: s.title, attemptCount: s.attemptCount, bestPct: s.bestPct, latestPct: s.latestPct });
  }

  return Array.from(subjectMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subject, ym]) => ({
      subject,
      label: SUBJECT_LABELS[subject] ?? subject,
      years: Array.from(ym.entries() as Iterable<[number, TopicSummary[]]>)
        .sort(([a], [b]) => a - b)
        .map(([year, topics]) => ({ year, topics })),
    }));
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ pct, label }: { pct: number; label: string }) {
  const colors =
    pct >= 80
      ? "bg-green-100 text-green-800"
      : pct >= 60
      ? "bg-indigo-100 text-indigo-700"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${colors}`}>
      {label}: {pct}%
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm p-3 sm:p-5 text-center min-h-[80px] sm:min-h-[96px]">
      <span className="text-2xl sm:text-3xl font-bold text-fg leading-none">{value}</span>
      <span className="mt-1 text-xs sm:text-sm text-muted leading-tight">{label}</span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <PageContainer as="main">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-44 mb-1" />
        <div className="h-5 bg-gray-100 rounded w-64 mb-8" />
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-3 sm:p-5 min-h-[80px] sm:min-h-[96px] flex flex-col items-center justify-center gap-2">
              <div className="h-7 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-5 h-[88px]" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function ProgressClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);

  useEffect(() => {
    const configured =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!configured) {
      router.replace("/login");
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: rows } = await supabase
        .from("attempts")
        .select(`
          id,
          score,
          total,
          created_at,
          worksheets (
            id,
            title,
            topics (
              subject_slug,
              year_level,
              slug,
              title
            )
          )
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setAttempts((rows ?? []) as AttemptRow[]);
      setStatus("ready");
    });
  }, [router]);

  if (status === "loading") return <Skeleton />;

  const total = attempts.length;
  const avgPct =
    total > 0
      ? Math.round(
          attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / total
        )
      : 0;
  const streak = calcStreak(attempts);
  const groups = buildGroups(attempts);

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-1">Your Progress</h1>
      <p className="text-muted mb-8">
        {total === 0
          ? "Start a worksheet to see your progress here."
          : "Every attempt moves you forward — keep it up!"}
      </p>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-10">
        <StatCard value={total} label={total === 1 ? "Worksheet done" : "Worksheets done"} />
        <StatCard value={total > 0 ? `${avgPct}%` : "—"} label="Average score" />
        <StatCard
          value={streak > 0 ? streak : "—"}
          label={streak === 1 ? "Day streak" : "Day streak"}
        />
      </div>

      {/* ── Empty state ── */}
      {total === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <p className="text-lg font-semibold text-fg mb-2">Nothing here yet</p>
          <p className="text-muted mb-6">
            Complete your first worksheet and your score will appear here.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
          >
            Browse Topics
          </Link>
        </div>
      )}

      {/* ── Topic groups ── */}
      {groups.map((sg) => (
        <section key={sg.subject} className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">{sg.label}</h2>

          {sg.years.map((yg) => (
            <div key={yg.year} className="mb-6">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Year {yg.year}
              </h3>

              <ul className="flex flex-col gap-3">
                {yg.topics.map((t) => (
                  <li key={t.topicSlug}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-white shadow-sm p-5">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-fg leading-snug mb-2 capitalize">
                          {t.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <ScoreBadge pct={t.bestPct} label="Best" />
                          {t.latestPct !== t.bestPct && (
                            <ScoreBadge pct={t.latestPct} label="Latest" />
                          )}
                          <span className="text-xs text-muted">
                            {t.attemptCount} {t.attemptCount === 1 ? "attempt" : "attempts"}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/learn/${sg.subject}/${yg.year}/${t.topicSlug}`}
                        className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg border border-border text-sm font-semibold text-fg hover:bg-gray-50 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </PageContainer>
  );
}
