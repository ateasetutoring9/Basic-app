import type { Metadata } from "next";
import Link from "next/link";
import { getActiveSubjects } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";

export const metadata: Metadata = {
  title: "Browse",
  description: "Choose a year level to start learning — free lectures and worksheets for Years 7–12.",
};

export default async function BrowsePage() {
  const subjects = await getActiveSubjects();

  // Collect unique years that have at least one active subject
  const yearMap = new Map<string, { name: string; displayName: string; count: number }>();
  for (const s of subjects) {
    const y = s.year;
    if (!yearMap.has(y.name)) {
      yearMap.set(y.name, { name: y.name, displayName: y.displayName, count: 0 });
    }
    yearMap.get(y.name)!.count++;
  }

  // Show all Year 7–12 slots; mark unavailable ones as coming soon
  const ALL_YEAR_NAMES = ["year-7", "year-8", "year-9", "year-10", "year-11", "year-12"];
  const ALL_YEAR_DISPLAY: Record<string, string> = {
    "year-7": "Year 7", "year-8": "Year 8", "year-9": "Year 9",
    "year-10": "Year 10", "year-11": "Year 11", "year-12": "Year 12",
  };

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-2">Browse</h1>
      <p className="text-muted mb-8">Choose your year level to get started.</p>

      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ALL_YEAR_NAMES.map((yearName) => {
          const entry = yearMap.get(yearName);
          const displayName = entry?.displayName ?? ALL_YEAR_DISPLAY[yearName];
          const count = entry?.count ?? 0;
          const available = count > 0;

          return (
            <li key={yearName}>
              {available ? (
                <Link
                  href={`/browse/${yearName}`}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[110px] text-center"
                >
                  <span className="text-2xl font-bold text-fg">{displayName}</span>
                  <span className="mt-1.5 text-sm text-muted">
                    {count} subject{count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white opacity-50 p-6 min-h-[110px] text-center cursor-not-allowed"
                >
                  <span className="text-2xl font-bold text-fg">{displayName}</span>
                  <span className="mt-1.5 text-xs font-semibold text-gray-400">Coming soon</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
