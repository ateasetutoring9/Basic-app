import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  const seen = new Set<string>();
  return topics
    .filter((t) => {
      const key = `${t.subject.year.name}-${t.subject.syncId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((t) => ({ year: t.subject.year.name, subject: t.subject.syncId }));
}

const FORMAT_BADGE: Record<string, { label: string; classes: string }> = {
  text:   { label: "Text",   classes: "bg-indigo-100 text-indigo-700" },
  video:  { label: "Video",  classes: "bg-red-100 text-red-700" },
  slides: { label: "Slides", classes: "bg-amber-100 text-amber-700" },
};

interface Props {
  params: { year: string; subject: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topics = await getAllTopics();
  const match = topics.find(
    (t) => t.subject.year.name === params.year && t.subject.syncId === params.subject
  );
  if (!match) return { title: "Topics" };
  return {
    title: `${match.subject.year.displayName} ${match.subject.name}`,
    description: `${match.subject.year.displayName} ${match.subject.name} topics on At Ease Learning — free lectures and worksheets.`,
  };
}

export default async function YearSubjectPage({ params }: Props) {
  const allTopics = await getAllTopics();
  const topics = allTopics
    .filter((t) => t.subject.year.name === params.year && t.subject.syncId === params.subject)
    .sort((a, b) => a.id - b.id);

  if (topics.length === 0) notFound();

  const { subject } = topics[0];
  const yearDisplay = subject.year.displayName;

  return (
    <PageContainer as="main">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/browse/${params.year}`} className="hover:text-fg transition-colors">{yearDisplay}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">{subject.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">
        {yearDisplay} — {subject.name}
      </h1>
      <p className="text-muted mb-8">
        {topics.length} topic{topics.length !== 1 ? "s" : ""}
      </p>

      <ul className="flex flex-col gap-4">
        {topics.map((topic) => {
          const fmt = topic.lecture?.format;
          const badge = fmt ? FORMAT_BADGE[fmt] : null;

          return (
            <li key={topic.syncId}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-white shadow-sm p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-base font-bold text-fg leading-snug">{topic.title}</h2>
                    {badge && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-muted leading-relaxed line-clamp-2">{topic.description}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {topic.lecture ? (
                    <Link
                      href={`/learn/${topic.syncId}`}
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
