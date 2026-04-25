import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllTopics, getTopicBySyncId } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import { WorksheetClient } from "@/components/WorksheetClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  return topics
    .filter((t) => !!t.worksheet)
    .map((t) => ({ syncId: t.syncId }));
}

interface Props {
  params: { syncId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySyncId(params.syncId);
  return {
    title: topic ? `${topic.title} — Worksheet` : "Worksheet",
    description: topic
      ? `Practice ${topic.title} with an interactive worksheet on At Ease Learning.`
      : undefined,
  };
}

export default async function WorksheetPage({ params }: Props) {
  const topic = await getTopicBySyncId(params.syncId);
  if (!topic?.worksheet) notFound();

  const { worksheet, title, subject } = topic;
  const yearName = subject.year.name;
  const yearDisplay = subject.year.displayName;
  const topicUrl = `/learn/${topic.syncId}`;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${yearName}`} className="hover:text-fg transition-colors">{yearDisplay}</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${yearName}/${subject.syncId}`} className="hover:text-fg transition-colors">{subject.name}</Link>
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
