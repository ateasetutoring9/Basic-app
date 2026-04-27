import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTopicBySyncId } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import { WorksheetClient } from "@/components/WorksheetClient";

export const dynamic = "force-dynamic";

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
  const topicUrl = `/learn/${topic.syncId}`;
  const subjectUrl = `/browse/${yearName}/${subject.syncId}`;

  return (
    <PageContainer as="main">
      <Link href={topicUrl} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors mb-6">
        ← {title}
      </Link>

      <h1 className="text-3xl font-bold text-fg mb-2">{worksheet.title}</h1>
      <p className="text-muted mb-8">
        {worksheet.questions.length} question{worksheet.questions.length !== 1 ? "s" : ""}
      </p>

      <WorksheetClient worksheet={worksheet} topicUrl={topicUrl} subjectUrl={subjectUrl} />
    </PageContainer>
  );
}
