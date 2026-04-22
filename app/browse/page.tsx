import type { Metadata } from "next";
import Link from "next/link";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { YearLevel } from "@/lib/content/types";

export const metadata: Metadata = {
  title: "Browse",
  description: "Choose a year level to start learning — free lectures and worksheets for Years 7–12.",
};

const ALL_YEARS: YearLevel[] = [7, 8, 9, 10, 11, 12];

export default async function BrowsePage() {
  const allTopics = await getAllTopics();

  const countByYear: Partial<Record<YearLevel, number>> = {};
  for (const topic of allTopics) {
    countByYear[topic.year] = (countByYear[topic.year] ?? 0) + 1;
  }

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-2">Browse</h1>
      <p className="text-muted mb-8">Choose your year level to get started.</p>

      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ALL_YEARS.map((year) => {
          const count = countByYear[year] ?? 0;
          const available = count > 0;

          return (
            <li key={year}>
              {available ? (
                <Link
                  href={`/browse/${year}`}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[110px] text-center"
                >
                  <span className="text-2xl font-bold text-fg">Year {year}</span>
                  <span className="mt-1.5 text-sm text-muted">
                    {count} topic{count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-white opacity-50 p-6 min-h-[110px] text-center cursor-not-allowed"
                >
                  <span className="text-2xl font-bold text-fg">Year {year}</span>
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
