import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { Database } from "@/lib/supabase/database.types";

type Attempt = Database["public"]["Tables"]["attempts"]["Row"];

// ─── Subject display names ────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

// ─── Stats helpers ────────────────────────────────────────────────────────────

function calcStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  // Collect unique UTC date strings, most-recent first
  const days = Array.from(
    new Set(attempts.map((a) => a.created_at.slice(0, 10)))
  ).sort((a, b) => (a > b ? -1 : 1));

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Streak only active if attempted today or yesterday
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

function buildGroups(
  attempts: Attempt[],
  titleMap: Map<string, string>
): SubjectGroup[] {
  // attempts already sorted created_at desc from Supabase

  // key → topic summary (first-seen = most recent)
  const summaryMap = new Map<string, TopicSummary & { subject: string; year: number }>();

  for (const a of attempts) {
    const key = `${a.subject}/${a.year}/${a.topic_slug}`;
    const pct = Math.round((a.score / a.total) * 100);
    const existing = summaryMap.get(key);
    if (!existing) {
      summaryMap.set(key, {
        subject: a.subject,
        year: a.year,
        topicSlug: a.topic_slug,
        title: titleMap.get(key) ?? a.topic_slug.replace(/-/g, " "),
        attemptCount: 1,
        bestPct: pct,
        latestPct: pct,
      });
    } else {
      existing.attemptCount++;
      if (pct > existing.bestPct) existing.bestPct = pct;
    }
  }

  // Roll up into subject → year → topics
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm p-5 text-center min-h-[96px]">
      <span className="text-3xl font-bold text-fg">{value}</span>
      <span className="mt-1 text-sm text-muted">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch attempts + topic titles in parallel
  const [{ data: rows }, allTopics] = await Promise.all([
    supabase
      .from("attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getAllTopics(),
  ]);

  const attempts = rows ?? [];

  // Build a lookup: "subject/year/slug" → title
  const titleMap = new Map<string, string>(
    allTopics.map((t) => [`${t.subject}/${t.year}/${t.slug}`, t.title])
  );

  // Stats
  const total = attempts.length;
  const avgPct =
    total > 0
      ? Math.round(
          attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / total
        )
      : 0;
  const streak = calcStreak(attempts);

  const groups = buildGroups(attempts, titleMap);

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-1">Your Progress</h1>
      <p className="text-muted mb-8">
        {total === 0
          ? "Start a worksheet to see your progress here."
          : "Every attempt moves you forward — keep it up!"}
      </p>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-10">
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
                      {/* Topic info */}
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

                      {/* CTA */}
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
