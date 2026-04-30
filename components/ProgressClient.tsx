"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttemptRow {
  id: number;
  score: number;
  total: number;
  created_at: string;
  worksheets: {
    id: number;
    title: string;
    topics: {
      sync_id: string;
      title: string;
      subjects: {
        name: string;
        years: { display_name: string } | null;
      } | null;
    } | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    if (Math.round((prev.getTime() - curr.getTime()) / 86_400_000) === 1) streak++;
    else break;
  }
  return streak;
}

function scoreBg(pct: number) {
  if (pct >= 80) return "bg-green-100 text-green-800";
  if (pct >= 60) return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-800";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Summary grouping ─────────────────────────────────────────────────────────

interface TopicSummary {
  topicSyncId: string;
  latestAttemptId: number;
  title: string;
  attemptCount: number;
  bestPct: number;
  latestPct: number;
}
interface YearGroup { yearDisplay: string; topics: TopicSummary[] }
interface SubjectGroup { subjectName: string; years: YearGroup[] }

function buildGroups(attempts: AttemptRow[]): SubjectGroup[] {
  const summaryMap = new Map<string, TopicSummary & { subjectName: string; yearDisplay: string }>();
  for (const a of attempts) {
    const topic = a.worksheets?.topics;
    if (!topic) continue;
    const key = topic.sync_id;
    const pct = Math.round((a.score / a.total) * 100);
    const existing = summaryMap.get(key);
    if (!existing) {
      summaryMap.set(key, {
        subjectName: topic.subjects?.name ?? "Unknown",
        yearDisplay: topic.subjects?.years?.display_name ?? "",
        topicSyncId: topic.sync_id,
        latestAttemptId: a.id,
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

  const subjectMap = new Map<string, Map<string, TopicSummary[]>>();
  for (const s of Array.from(summaryMap.values())) {
    if (!subjectMap.has(s.subjectName)) subjectMap.set(s.subjectName, new Map());
    const ym = subjectMap.get(s.subjectName)!;
    if (!ym.has(s.yearDisplay)) ym.set(s.yearDisplay, []);
    ym.get(s.yearDisplay)!.push({
      topicSyncId: s.topicSyncId,
      latestAttemptId: s.latestAttemptId,
      title: s.title,
      attemptCount: s.attemptCount,
      bestPct: s.bestPct,
      latestPct: s.latestPct,
    });
  }

  return Array.from(subjectMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subjectName, ym]) => ({
      subjectName,
      years: Array.from(ym.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([yearDisplay, topics]) => ({ yearDisplay, topics })),
    }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm p-3 sm:p-5 text-center min-h-[80px] sm:min-h-[96px]">
      <span className="text-2xl sm:text-3xl font-bold text-fg leading-none">{value}</span>
      <span className="mt-1 text-xs sm:text-sm text-muted leading-tight">{label}</span>
    </div>
  );
}

function ScoreBadge({ pct, label }: { pct: number; label: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBg(pct)}`}>
      {label}: {pct}%
    </span>
  );
}

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

// ─── Summary view ─────────────────────────────────────────────────────────────

function SummaryView({ attempts }: { attempts: AttemptRow[] }) {
  const groups = buildGroups(attempts);

  if (attempts.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <p className="text-lg font-semibold text-fg mb-2">Nothing here yet</p>
        <p className="text-muted mb-6">Complete your first worksheet and your score will appear here.</p>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          Browse Topics
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map((sg) => (
        <section key={sg.subjectName}>
          <h2 className="text-xl font-bold text-fg mb-4">{sg.subjectName}</h2>
          {sg.years.map((yg) => (
            <div key={yg.yearDisplay} className="mb-6">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                {yg.yearDisplay}
              </h3>
              <ul className="flex flex-col gap-3">
                {yg.topics.map((t) => (
                  <li key={t.topicSyncId}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-white shadow-sm p-5">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-fg leading-snug mb-2">{t.title}</p>
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
                        href={`/progress/${t.latestAttemptId}`}
                        className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg border border-border text-sm font-semibold text-fg hover:bg-gray-50 transition-colors"
                      >
                        Review latest
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

// ─── History view ─────────────────────────────────────────────────────────────

function HistoryView({ attempts }: { attempts: AttemptRow[] }) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <p className="text-lg font-semibold text-fg mb-2">No attempts yet</p>
        <p className="text-muted mb-6">Your attempt history will appear here after you complete a worksheet.</p>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          Browse Topics
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-fg">Topic</th>
            <th className="text-left px-4 py-3 font-semibold text-fg hidden sm:table-cell">Subject</th>
            <th className="text-left px-4 py-3 font-semibold text-fg">Score</th>
            <th className="text-left px-4 py-3 font-semibold text-fg hidden sm:table-cell">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {attempts.map((a) => {
            const topic = a.worksheets?.topics;
            const pct = Math.round((a.score / a.total) * 100);
            return (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-fg leading-snug">
                    {topic?.title ?? a.worksheets?.title ?? "Unknown topic"}
                  </p>
                  <p className="text-xs text-muted sm:hidden mt-0.5">{formatDate(a.created_at)}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="text-muted">{topic?.subjects?.name ?? "—"}</p>
                  <p className="text-xs text-muted">{topic?.subjects?.years?.display_name ?? ""}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBg(pct)}`}>
                    {a.score}/{a.total} · {pct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-muted hidden sm:table-cell">{formatDate(a.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/progress/${a.id}`}
                    className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = "summary" | "history";

export function ProgressClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [tab, setTab] = useState<Tab>("summary");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/progress", { credentials: "include" });
      if (res.status === 401) { router.replace("/login"); return; }
      setAttempts(res.ok ? await res.json() : []);
      setStatus("ready");
    })();
  }, [router]);

  if (status === "loading") return <Skeleton />;

  const total = attempts.length;
  const avgPct = total > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / total)
    : 0;
  const streak = calcStreak(attempts);

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-1">Your Progress</h1>
      <p className="text-muted mb-8">
        {total === 0 ? "Start a worksheet to see your progress here." : "Every attempt moves you forward — keep it up!"}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <StatCard value={total} label={total === 1 ? "Worksheet done" : "Worksheets done"} />
        <StatCard value={total > 0 ? `${avgPct}%` : "—"} label="Average score" />
        <StatCard value={streak > 0 ? streak : "—"} label={streak === 1 ? "Day streak" : "Day streak"} />
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-6">
        {(["summary", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors capitalize ${
              tab === t ? "bg-white text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {t === "summary" ? "By Topic" : "All Attempts"}
          </button>
        ))}
      </div>

      {tab === "summary" ? (
        <SummaryView attempts={attempts} />
      ) : (
        <HistoryView attempts={attempts} />
      )}
    </PageContainer>
  );
}
