import Link from "next/link";
import { getRecommendedTopics } from "../_lib/loaders";
import type { RecommendedTopic } from "../_lib/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function RecommendedSkeleton() {
  return (
    <section className="mb-12 md:mb-20">
      <div className="h-7 bg-gray-100 rounded w-56 mb-2 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-80 mb-6 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-5 bg-gray-100 rounded w-5/6" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Tile ────────────────────────────────────────────────────────────────────

function RecommendedTile({ topic }: { topic: RecommendedTopic }) {
  return (
    <Link
      href={`/learn/${topic.topicSyncId}`}
      className="group flex flex-col rounded-xl border border-border bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        {topic.subjectName}
      </p>
      <p className="font-semibold text-fg leading-snug group-hover:text-primary transition-colors">
        {topic.topicTitle}
      </p>
    </Link>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export async function Recommended() {
  let topics: RecommendedTopic[] = [];
  try {
    topics = await getRecommendedTopics(3);
  } catch {
    return null;
  }

  // Hide entirely if nothing to show
  if (!topics.length) return null;

  return (
    <section className="mb-12 md:mb-20">
      {/* TODO: replace heading with "Recommended for [Year X]" once year_id exists on users */}
      <h2 className="text-xl font-bold text-fg mb-1">Recommended</h2>
      <p className="text-sm text-muted mb-6">
        Sensible places to start. Not algorithmic — just what most students tackle this term.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {topics.map((t) => (
          <RecommendedTile key={t.topicSyncId} topic={t} />
        ))}
      </div>
    </section>
  );
}
