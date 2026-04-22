import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllTopics, getTopic } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import { WorksheetClient } from "@/components/WorksheetClient";
import type { Subject, YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  return topics
    .filter((t) => !!t.worksheet)
    .map((t) => ({ subject: t.subject, year: String(t.year), topic: t.slug }));
}

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

interface Props {
  params: { subject: string; year: string; topic: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = parseInt(params.year, 10) as YearLevel;
  const topic = await getTopic(params.subject as Subject, year, params.topic);
  return {
    title: topic ? `${topic.title} — Worksheet` : "Worksheet",
    description: topic
      ? `Practice ${topic.title} with an interactive worksheet on At Ease Learning.`
      : undefined,
  };
}

export default async function WorksheetPage({ params }: Props) {
  const { subject, year: yearStr, topic: slug } = params;
  const year = parseInt(yearStr, 10) as YearLevel;

  const topicData = await getTopic(subject as Subject, year, slug);
  if (!topicData?.worksheet) notFound();

  const { worksheet, title } = topicData;
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const topicUrl = `/learn/${subject}/${yearStr}/${slug}`;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${yearStr}`} className="hover:text-fg transition-colors">Year {yearStr}</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${yearStr}/${subject}`} className="hover:text-fg transition-colors">{subjectLabel}</Link>
        <span aria-hidden>/</span>
        <Link href={topicUrl} className="hover:text-fg transition-colors">{title}</Link>
        <span aria-hidden>/</span>
        <span className="text-fg font-medium">Worksheet</span>
      </nav>

      <h1 className="text-3xl font-bold text-fg mb-2">{worksheet.title}</h1>
      <p className="text-muted mb-8">
        {worksheet.questions.length} question{worksheet.questions.length !== 1 ? "s" : ""}
      </p>

      <WorksheetClient worksheet={worksheet} topicUrl={topicUrl} />
    </PageContainer>
  );
}
