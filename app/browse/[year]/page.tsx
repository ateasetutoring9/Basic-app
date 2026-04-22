import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  const years = new Set(topics.map((t) => String(t.year)));
  return Array.from(years).map((year) => ({ year }));
}

const VALID_YEARS = new Set([7, 8, 9, 10, 11, 12]);

const SUBJECT_CATALOGUE: {
  subject: string;
  label: string;
  description: string;
  accent: string;
}[] = [
  { subject: "math",    label: "Mathematics", description: "Algebra, geometry, trigonometry, statistics and more", accent: "border-indigo-400" },
  { subject: "science", label: "Science",      description: "Physics, chemistry, biology and earth sciences",      accent: "border-emerald-400" },
  { subject: "english", label: "English",      description: "Reading, writing, literature and language skills",    accent: "border-amber-400" },
  { subject: "history", label: "History",      description: "Australian and world history across the ages",        accent: "border-rose-400" },
];

interface Props {
  params: { year: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Year ${params.year}`,
    description: `Browse Year ${params.year} subjects — free lectures and worksheets on At Ease Learning.`,
  };
}

export default async function YearPage({ params }: Props) {
  const yearNum = parseInt(params.year, 10);
  if (!VALID_YEARS.has(yearNum)) notFound();
  const year = yearNum as YearLevel;

  const allTopics = await getAllTopics();
  const topicsForYear = allTopics.filter((t) => t.year === year);
  if (topicsForYear.length === 0) notFound();

  const countBySubject: Record<string, number> = {};
  for (const topic of topicsForYear) {
    countBySubject[topic.subject] = (countBySubject[topic.subject] ?? 0) + 1;
  }

  return (
    <PageContainer as="main">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">Year {year}</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">Year {year}</h1>
      <p className="text-muted mb-8">Select a subject.</p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SUBJECT_CATALOGUE.map(({ subject, label, description, accent }) => {
          const count = countBySubject[subject] ?? 0;
          const available = count > 0;

          return (
            <li key={subject}>
              {available ? (
                <Link
                  href={`/browse/${year}/${subject}`}
                  className="group flex flex-col h-full rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[100px]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`w-1.5 self-stretch rounded-full ${accent} bg-current`} />
                    <div className="flex-1">
                      <span className="text-lg font-bold text-fg leading-tight">{label}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {count} topic{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{description}</p>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col h-full rounded-xl border border-border bg-white opacity-60 p-6 min-h-[100px] cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`w-1.5 self-stretch rounded-full ${accent} bg-current`} />
                    <div className="flex-1">
                      <span className="text-lg font-bold text-fg leading-tight">{label}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Coming soon
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{description}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
