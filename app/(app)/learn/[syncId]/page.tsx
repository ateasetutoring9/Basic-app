import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySyncId } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import MarkdownContent from "@/components/lecture/MarkdownContent";
import YouTubeFacade from "@/components/lecture/YouTubeFacade";
import SlidesViewer from "@/components/lecture/SlidesViewer";

export const runtime = 'edge';

export const dynamic = "force-dynamic";

const FORMAT_LABELS: Record<string, string> = {
  text: "Reading",
  video: "Video",
  slides: "Slides",
};

interface Props {
  params: { syncId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySyncId(params.syncId);
  return {
    title: topic?.title ?? "Lecture",
    description: topic?.description ?? undefined,
  };
}

export default async function LearnPage({ params }: Props) {
  const topic = await getTopicBySyncId(params.syncId);
  if (!topic?.lecture) notFound();

  const { lecture, worksheet, title, description, subject } = topic;
  const yearName = subject.year.name;

  return (
    <PageContainer as="main">
      <Link
        href={`/browse/${yearName}/${subject.syncId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors mb-6"
      >
        ← {subject.name}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {FORMAT_LABELS[lecture.format] ?? lecture.format}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-fg leading-snug mb-2">{title}</h1>
        {description && <p className="text-muted leading-relaxed">{description}</p>}
      </div>

      {/* Lecture content */}
      <div className="mb-12">
        {lecture.format === "text" && (
          <article aria-label="Lecture content">
            <MarkdownContent content={lecture.content} />
          </article>
        )}

        {lecture.format === "video" && (
          <YouTubeFacade
            youtubeId={lecture.content.youtubeId}
            title={title}
          />
        )}

        {lecture.format === "slides" && (
          <SlidesViewer html={lecture.content} title={title} />
        )}
      </div>

      {/* CTA */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
        {worksheet ? (
          <Link
            href={`/worksheet/${topic.syncId}`}
            className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Start Worksheet →
          </Link>
        ) : (
          <Link
            href={`/browse/${yearName}/${subject.syncId}`}
            className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors"
          >
            ← Back to Topics
          </Link>
        )}
      </div>
    </PageContainer>
  );
}
