import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { getWorksheetBySyncId, getNextTopicInSubject } from "../_lib/loaders";
import { WorksheetClient } from "./WorksheetClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ syncId: string }>;
}

const toSubjectSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { syncId } = await params;
  const worksheet = await getWorksheetBySyncId(syncId);
  if (!worksheet) return { title: "At Ease Learning" };
  return {
    title: `${worksheet.topic.title} — Worksheet — At Ease Learning`,
    description: `Practice ${worksheet.topic.title} with an interactive worksheet.`,
  };
}

export default async function WorksheetPage({ params }: Props) {
  const { syncId } = await params;

  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const session = await verifyToken(token);

  const worksheet = await getWorksheetBySyncId(syncId);
  if (!worksheet) notFound();

  const nextTopic = session
    ? await getNextTopicInSubject(
        worksheet.topic.subject.id,
        worksheet.topic.id
      )
    : null;

  const yearName = worksheet.topic.subject.yearName;
  const subjectSlug = toSubjectSlug(worksheet.topic.subject.name);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:border focus:border-border focus:rounded-lg focus:text-sm focus:font-medium focus:text-fg"
      >
        Skip to main content
      </a>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
              <li>
                <Link
                  href={`/browse/${yearName}`}
                  className="hover:text-fg transition-colors"
                >
                  {worksheet.topic.subject.yearDisplayName}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <Link
                  href={`/browse/${yearName}/${subjectSlug}`}
                  className="hover:text-fg transition-colors"
                >
                  {worksheet.topic.subject.name}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <Link
                  href={`/learn/${worksheet.topic.syncId}`}
                  className="hover:text-fg transition-colors"
                >
                  {worksheet.topic.title}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span className="text-fg font-medium" aria-current="page">
                  Worksheet
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-fg leading-snug mb-2">
              {worksheet.title}
            </h1>
            <p className="text-sm text-muted">
              {worksheet.questions.length} question
              {worksheet.questions.length !== 1 ? "s" : ""} · Difficulty{" "}
              {worksheet.difficulty}/5
            </p>
          </header>

          <WorksheetClient worksheet={worksheet} nextTopic={nextTopic} />

        </div>
      </main>
    </>
  );
}
