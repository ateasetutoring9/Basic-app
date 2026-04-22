import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  const seen = new Set<string>();
  return topics
    .filter((t) => {
      const key = `${t.subject}-${t.year}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((t) => ({ subject: t.subject, year: String(t.year) }));
}

const VALID_YEARS = new Set([7, 8, 9, 10, 11, 12]);

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

const FORMAT_BADGE: Record<string, { label: string; classes: string }> = {
  text:   { label: "Text",   classes: "bg-indigo-100 text-indigo-700" },
  video:  { label: "Video",  classes: "bg-red-100 text-red-700" },
  slides: { label: "Slides", classes: "bg-amber-100 text-amber-700" },
};

interface Props {
  params: { subject: string; year: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const label = SUBJECT_LABELS[params.subject] ?? params.subject;
  return {
    title: `Year ${params.year} ${label}`,
    description: `Year ${params.year} ${label} topics on LearnFree — free lectures and worksheets.`,
  };
}

export default async function YearTopicsPage({ params }: Props) {
  const { subject } = params;
  const yearNum = parseInt(params.year, 10);

  if (!VALID_YEARS.has(yearNum)) notFound();
  const year = yearNum as YearLevel;

  const allTopics = await getAllTopics();
  const topics = allTopics
    .filter((t) => t.subject === subject && t.year === year)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (topics.length === 0) notFound();

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">
          Browse
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/browse/${subject}`} className="hover:text-fg transition-colors">
          {subjectLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">Year {year}</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">
        Year {year} — {subjectLabel}
      </h1>
      <p className="text-muted mb-8">
        {topics.length} topic{topics.length !== 1 ? "s" : ""}
      </p>

      <ul className="flex flex-col gap-4">
        {topics.map((topic) => {
          const fmt = topic.lecture?.format;
          const badge = fmt ? FORMAT_BADGE[fmt] : null;

          return (
            <li key={topic.slug}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-white shadow-sm p-5">
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-base font-bold text-fg leading-snug">
                      {topic.title}
                    </h2>
                    {badge && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted leading-relaxed line-clamp-2">
                    {topic.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="shrink-0">
                  {topic.lecture ? (
                    <Link
                      href={`/learn/${subject}/${year}/${topic.slug}`}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[88px] px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                      Start
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center min-h-[44px] min-w-[88px] px-5 rounded-lg border border-border text-sm text-muted cursor-not-allowed">
                      No lecture
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
