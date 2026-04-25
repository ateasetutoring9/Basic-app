import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSubjects } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";

export const dynamicParams = false;

export async function generateStaticParams() {
  const subjects = await getActiveSubjects();
  const years = new Set(subjects.map((s) => s.year.name));
  return Array.from(years).map((year) => ({ year }));
}

const SUBJECT_ACCENTS: Record<string, string> = {
  Mathematics: "border-indigo-400",
  Science: "border-emerald-400",
  English: "border-amber-400",
  History: "border-rose-400",
};

interface Props {
  params: { year: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subjects = await getActiveSubjects();
  const year = subjects.find((s) => s.year.name === params.year)?.year;
  const display = year?.displayName ?? params.year;
  return {
    title: display,
    description: `Browse ${display} subjects — free lectures and worksheets on At Ease Learning.`,
  };
}

export default async function YearPage({ params }: Props) {
  const allSubjects = await getActiveSubjects();
  const subjectsForYear = allSubjects.filter((s) => s.year.name === params.year);

  if (subjectsForYear.length === 0) notFound();

  const yearDisplay = subjectsForYear[0].year.displayName;

  return (
    <PageContainer as="main">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">{yearDisplay}</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">{yearDisplay}</h1>
      <p className="text-muted mb-8">Select a subject.</p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {subjectsForYear.map((subject) => {
          const accent = SUBJECT_ACCENTS[subject.name] ?? "border-gray-300";

          return (
            <li key={subject.syncId}>
              <Link
                href={`/browse/${params.year}/${subject.syncId}`}
                className="group flex flex-col h-full rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[100px]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`w-1.5 self-stretch rounded-full ${accent} bg-current`} />
                  <div className="flex-1">
                    <span className="text-lg font-bold text-fg leading-tight">{subject.name}</span>
                  </div>
                </div>
                {subject.description && (
                  <p className="text-sm text-muted leading-relaxed">{subject.description}</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
