import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import {
  getTopicWithLecture,
  getWorksheetMetaForTopic,
  getCommentCountForTopic,
  getCommentsForTopic,
} from "../_lib/loaders";
import { LectureContent } from "../_components/LectureContent";
import { WorksheetCta } from "../_components/WorksheetCta";
import { Discussion } from "../_components/Discussion";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ syncId: string }>;
}

const toSubjectSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-");

function estimateReadMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { syncId } = await params;
  const topic = await getTopicWithLecture(syncId);
  if (!topic) return { title: "At Ease Learning" };
  return {
    title: `${topic.title} — At Ease Learning`,
    description: `${topic.subject.name} · ${topic.subject.yearDisplayName} on At Ease Learning.`,
  };
}

export default async function LearnPage({ params }: Props) {
  const { syncId } = await params;

  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const session = (await verifyToken(token))!;

  const topic = await getTopicWithLecture(syncId);
  if (!topic) notFound();

  const [worksheetMeta, commentCount, comments] = await Promise.all([
    getWorksheetMetaForTopic(topic.id, session.userId),
    getCommentCountForTopic(topic.id),
    getCommentsForTopic(topic.id),
  ]);

  const lecture = topic.lecture;
  const lectureAvailable = lecture !== null && lecture.isPublished;
  const worksheetAvailable = worksheetMeta !== null && worksheetMeta.isPublished;

  // Sub-line derived from the published lecture format
  let subLine: string | null = null;
  if (lecture && lecture.isPublished) {
    if (lecture.content.format === "text") {
      const mins = estimateReadMinutes(lecture.content.markdown);
      subLine = `~${mins} min read`;
    } else if (lecture.content.format === "video") {
      const secs = lecture.content.durationSeconds;
      subLine = secs ? `${Math.max(1, Math.round(secs / 60))} min watch` : "Video";
    } else {
      subLine = "Slide deck";
    }
  }

  const isWide =
    lecture?.content.format === "video" || lecture?.content.format === "slides";
  const maxWidth = isWide ? "max-w-5xl" : "max-w-2xl";
  const subjectSlug = toSubjectSlug(topic.subject.name);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:border focus:border-border focus:rounded-lg focus:text-sm focus:font-medium focus:text-fg"
      >
        Skip to main content
      </a>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className={`${maxWidth} mx-auto px-4 py-8`}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
              <li>
                <Link
                  href={`/browse/${topic.subject.yearName}`}
                  className="hover:text-fg transition-colors"
                >
                  {topic.subject.yearDisplayName}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <Link
                  href={`/browse/${topic.subject.yearName}/${subjectSlug}`}
                  className="hover:text-fg transition-colors"
                >
                  {topic.subject.name}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span className="text-fg font-medium" aria-current="page">
                  {topic.title}
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-fg leading-snug mb-2">{topic.title}</h1>
            {subLine && <p className="text-sm text-muted">{subLine}</p>}
          </header>

          {/* Lecture content */}
          <div className="mb-8">
            {!lectureAvailable && !worksheetAvailable ? (
              <p className="text-muted py-12 text-center italic">
                This topic is being prepared. Check back soon.
              </p>
            ) : !lectureAvailable ? (
              <p className="text-muted py-6 italic">Lecture coming soon.</p>
            ) : lecture ? (
              <LectureContent lecture={lecture} />
            ) : null}
          </div>

          {/* Worksheet CTA */}
          {worksheetMeta !== null && worksheetMeta.isPublished && (
            <WorksheetCta meta={worksheetMeta} />
          )}

          {/* Discussion */}
          <Discussion commentCount={commentCount} comments={comments} />

        </div>
      </main>
    </>
  );
}
