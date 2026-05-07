import type { Metadata } from "next";
import Link from "next/link";
import { getAllYears } from "./_lib/loaders";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse — At Ease Learning",
  description: "Browse free lectures and worksheets for Years 7–12.",
};

export default async function BrowsePage() {
  const years = await getAllYears();

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-fg mb-2">Browse the library</h1>
        <p className="text-muted mb-10">Years 7–12 · all subjects · everything free.</p>

        {years.length === 0 ? (
          <p className="text-muted">No year levels are available yet — check back soon.</p>
        ) : (
          <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {years.map((year) => (
              <li key={year.name}>
                {year.subjectCount > 0 ? (
                  <Link
                    href={`/browse/${year.name}`}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-white p-6 min-h-[110px] text-center hover:border-indigo-300 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="text-2xl font-bold text-fg group-hover:text-primary transition-colors leading-tight">
                      {year.displayName}
                    </span>
                    <span className="mt-2 text-sm text-muted">
                      {year.subjectCount} {year.subjectCount === 1 ? "subject" : "subjects"}
                    </span>
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-6 min-h-[110px] text-center opacity-40 cursor-not-allowed"
                  >
                    <span className="text-2xl font-bold text-fg leading-tight">
                      {year.displayName}
                    </span>
                    <span className="mt-2 text-xs font-medium text-muted">Coming soon</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
