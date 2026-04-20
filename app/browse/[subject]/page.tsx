import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics, getSubjects } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const subjects = await getSubjects();
  return subjects.map((s) => ({ subject: s.subject }));
}

const ALL_YEARS: YearLevel[] = [7, 8, 9, 10, 11, 12];

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

interface Props {
  params: { subject: string };
}

export default async function SubjectPage({ params }: Props) {
  const { subject } = params;

  const allTopics = await getAllTopics();
  const topicsForSubject = allTopics.filter((t) => t.subject === subject);

  if (topicsForSubject.length === 0) notFound();

  const countByYear: Partial<Record<YearLevel, number>> = {};
  for (const topic of topicsForSubject) {
    countByYear[topic.year] = (countByYear[topic.year] ?? 0) + 1;
  }

  const label = SUBJECT_LABELS[subject] ?? subject;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted mb-6 flex items-center gap-1.5">
        <Link href="/browse" className="hover:text-fg transition-colors">
          Browse
        </Link>
        <span>/</span>
        <span className="text-fg font-medium">{label}</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">{label}</h1>
      <p className="text-muted mb-8">Select your year level.</p>

      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ALL_YEARS.map((year) => {
          const count = countByYear[year] ?? 0;
          const available = count > 0;

          return (
            <li key={year}>
              {available ? (
                <Link
                  href={`/browse/${subject}/${year}`}
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
                  <span className="mt-1.5 text-xs font-semibold text-gray-400">
                    Coming soon
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
