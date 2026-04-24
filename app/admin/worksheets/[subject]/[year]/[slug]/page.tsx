import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics, getTopic } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import { WorksheetEditorClient } from "@/components/admin/WorksheetEditorClient";
import type { Subject, YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  return topics.map((t) => ({
    subject: t.subject,
    year: String(t.year),
    slug: t.slug,
  }));
}

interface Props {
  params: { subject: string; year: string; slug: string };
}

export default async function EditWorksheetPage({ params }: Props) {
  const { subject, year: yearStr, slug } = params;
  const year = parseInt(yearStr, 10) as YearLevel;
  const topic = await getTopic(subject as Subject, year, slug);
  if (!topic) notFound();

  return (
    <PageContainer as="main">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5">
        <Link href="/admin/worksheets" className="hover:text-fg transition-colors">
          Worksheet Editor
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">{topic.title}</span>
      </nav>

      <WorksheetEditorClient
        subject={subject}
        year={yearStr}
        slug={slug}
        topicTitle={topic.title}
        initialWorksheet={topic.worksheet ?? null}
      />
    </PageContainer>
  );
}
