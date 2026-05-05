import type { Metadata } from "next";
import Link from "next/link";
import { getActiveYears, getActiveSubjects } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Browse",
  description: "Choose a year level to start learning — free lectures and worksheets.",
};

export default async function BrowsePage() {
  const [years, subjects] = await Promise.all([
    getActiveYears(),
    getActiveSubjects(),
  ]);

  // Count active subjects per year
  const subjectCountByYear = new Map<string, number>();
  for (const s of subjects) {
    const key = s.year.name;
    subjectCountByYear.set(key, (subjectCountByYear.get(key) ?? 0) + 1);
  }

  if (years.length === 0) {
    return (
      <PageContainer as="main">
        <h1 className="text-3xl font-bold text-fg mb-2">Browse</h1>
        <p className="text-muted">No year levels are available yet. Check back soon.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-2">Browse</h1>
      <p className="text-muted mb-8">Choose your year level to get started.</p>

      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {years.map((year) => {
          const count = subjectCountByYear.get(year.name) ?? 0;
          const available = count > 0;

          return (
            <li key={year.name}>
              {available ? (
                <Link
                  href={`/browse/${year.name}`}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[110px] text-center"
                >
                  <span className="text-2xl font-bold text-fg">{year.displayName}</span>
                  <span className="mt-1.5 text-sm text-muted">
                    {count} subject{count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white opacity-50 p-6 min-h-[110px] text-center cursor-not-allowed"
                >
                  <span className="text-2xl font-bold text-fg">{year.displayName}</span>
                  <span className="mt-1.5 text-xs font-semibold text-gray-400">No subjects yet</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
