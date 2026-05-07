import Link from "next/link";
import { getUserSubjects } from "../_lib/loaders";
import type { DashboardSubject } from "../_lib/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function YourSubjectsSkeleton() {
  return (
    <section className="mb-12 md:mb-20">
      <div className="h-7 bg-gray-100 rounded w-36 mb-6 animate-pulse" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Tile ────────────────────────────────────────────────────────────────────

function SubjectTile({ subject }: { subject: DashboardSubject }) {
  const href =
    subject.yearName
      ? `/browse/${subject.yearName}/${subject.syncId}`
      : `/browse`;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="font-semibold text-fg leading-snug mb-1 group-hover:text-primary transition-colors">
        {subject.name}
      </p>
      <p className="text-sm text-muted">
        {subject.topicCount} {subject.topicCount === 1 ? "topic" : "topics"}
      </p>
    </Link>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export async function YourSubjects({ userId }: { userId: number }) {
  void userId; // passed for API consistency; filtering by user not yet implemented
  let subjects: DashboardSubject[] = [];
  try {
    subjects = await getUserSubjects();
  } catch {
    return (
      <section className="mb-12 md:mb-20">
        <h2 className="text-xl font-bold text-fg mb-4">Your subjects</h2>
        <p className="text-sm text-muted">
          Couldn&apos;t load this section. Refresh to try again.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-20">
      <h2 className="text-xl font-bold text-fg mb-6">Your subjects</h2>
      {subjects.length === 0 ? (
        <p className="text-muted text-sm">No subjects available yet.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {subjects.map((s) => (
            <SubjectTile key={s.syncId} subject={s} />
          ))}
        </div>
      )}
    </section>
  );
}
