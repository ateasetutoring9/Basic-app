import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTopics, getTopic } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import MarkdownContent from "@/components/lecture/MarkdownContent";
import YouTubeFacade from "@/components/lecture/YouTubeFacade";
import SlidesViewer from "@/components/lecture/SlidesViewer";
import type { Subject, YearLevel } from "@/lib/content/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  const topics = await getAllTopics();
  return topics
    .filter((t) => !!t.lecture)
    .map((t) => ({ subject: t.subject, year: String(t.year), topic: t.slug }));
}

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

const FORMAT_LABELS: Record<string, string> = {
  text: "Reading",
  video: "Video",
  slides: "Slides",
};

interface Props {
  params: { subject: string; year: string; topic: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = parseInt(params.year, 10) as YearLevel;
  const topic = await getTopic(params.subject as Subject, year, params.topic);
  return {
    title: topic?.title ?? "Lecture",
    description: topic?.description,
  };
}

export default async function LearnPage({ params }: Props) {
  const { subject, year: yearStr, topic: slug } = params;
  const year = parseInt(yearStr, 10) as YearLevel;

  const topicData = await getTopic(subject as Subject, year, slug);
  if (!topicData?.lecture) notFound();

  const { lecture, worksheet, title, description } = topicData;
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/browse" className="hover:text-fg transition-colors">Browse</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${subject}`} className="hover:text-fg transition-colors">{subjectLabel}</Link>
        <span aria-hidden>/</span>
        <Link href={`/browse/${subject}/${yearStr}`} className="hover:text-fg transition-colors">Year {yearStr}</Link>
        <span aria-hidden>/</span>
        <span className="text-fg font-medium">{title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {FORMAT_LABELS[lecture.format] ?? lecture.format}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-fg leading-snug mb-2">{title}</h1>
        <p className="text-muted leading-relaxed">{description}</p>
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
            href={`/worksheet/${subject}/${yearStr}/${slug}`}
            className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Start Worksheet →
          </Link>
        ) : (
          <Link
            href={`/browse/${subject}/${yearStr}`}
            className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors"
          >
            ← Back to Topics
          </Link>
        )}
      </div>
    </PageContainer>
  );
}
