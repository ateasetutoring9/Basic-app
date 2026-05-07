import Link from "next/link";
import { getInProgressTopics } from "../_lib/loaders";
import type { InProgressTopic } from "../_lib/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function ContinueLearningSkeleton() {
  return (
    <section className="mb-12 md:mb-20">
      <div className="h-8 bg-gray-100 rounded w-48 mb-6 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-5" />
            <div className="h-9 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <section className="mb-12 md:mb-20">
      <h1 className="text-2xl font-bold text-fg mb-6">Let&apos;s get you started.</h1>
      <div className="rounded-xl border border-border bg-white p-6 md:p-8">
        <div className="flex flex-col gap-5 max-w-lg">
          {[
            "Pick a topic from your subjects below.",
            "Watch the lecture or read through the notes.",
            "Test yourself with the worksheet.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-primary text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-fg leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function TopicCard({ topic }: { topic: InProgressTopic }) {
  const href = topic.worksheetSyncId
    ? `/worksheet/${topic.worksheetSyncId}`
    : `/learn/${topic.topicSyncId}`;

  return (
    <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          {topic.subjectName}
        </p>
        <p className="font-semibold text-fg leading-snug">{topic.topicTitle}</p>
        <p className="text-sm text-muted mt-1">
          Worksheet in progress &mdash; {topic.latestScore}/{topic.latestTotal} correct
        </p>
      </div>
      <div>
        <Link
          href={href}
          className="inline-flex items-center justify-center min-h-[40px] px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue worksheet
        </Link>
      </div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function SectionError() {
  return (
    <section className="mb-12 md:mb-20">
      <h1 className="text-2xl font-bold text-fg mb-4">Continue learning</h1>
      <p className="text-sm text-muted">
        Couldn&apos;t load this section. Refresh to try again.
      </p>
    </section>
  );
}

export async function ContinueLearning({ userId }: { userId: number }) {
  let topics: InProgressTopic[] = [];
  try {
    topics = await getInProgressTopics(userId);
  } catch {
    return <SectionError />;
  }

  if (!topics.length) return <EmptyState />;

  return (
    <section className="mb-12 md:mb-20">
      <h1 className="text-2xl font-bold text-fg mb-6">Continue learning</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((t) => (
          <TopicCard key={t.topicSyncId} topic={t} />
        ))}
      </div>
    </section>
  );
}
