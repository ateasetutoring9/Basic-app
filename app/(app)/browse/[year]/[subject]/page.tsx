import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { getYearByName, getSubjectByYearAndSlug, getTopicsForSubject } from "../../_lib/loaders";
import { BreadcrumbNav } from "../../_components/BreadcrumbNav";
import { TopicRow } from "../../_components/TopicRow";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ year: string; subject: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, subject: subjectSlug } = await params;
  const yearObj = await getYearByName(year);
  if (!yearObj) return { title: "Browse — At Ease Learning" };
  const subjectObj = await getSubjectByYearAndSlug(yearObj.id, subjectSlug);
  if (!subjectObj) return { title: "Browse — At Ease Learning" };
  return {
    title: `${yearObj.displayName} ${subjectObj.name} — At Ease Learning`,
    description: `${yearObj.displayName} ${subjectObj.name} — free lectures and worksheets on At Ease Learning.`,
  };
}

export default async function SubjectPage({ params }: Props) {
  const { year, subject: subjectSlug } = await params;

  // App layout already verified the JWT — safe to assert non-null.
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const session = (await verifyToken(token))!;

  const yearObj = await getYearByName(year);
  if (!yearObj) notFound();

  const subjectObj = await getSubjectByYearAndSlug(yearObj.id, subjectSlug);
  if (!subjectObj) notFound();

  const topics = await getTopicsForSubject(subjectObj.id, session.userId);

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BreadcrumbNav
          crumbs={[
            { label: "Browse", href: "/browse" },
            { label: yearObj.displayName, href: `/browse/${year}` },
            { label: subjectObj.name },
          ]}
        />

        <h1 className="text-3xl font-bold text-fg mb-2">{subjectObj.name}</h1>
        <p className="text-muted mb-8">
          {topics.length} {topics.length === 1 ? "topic" : "topics"}. Click any to start.
        </p>

        {topics.length === 0 ? (
          <p className="text-muted text-sm">No topics here yet — coming soon.</p>
        ) : (
          <ul className="rounded-xl border border-border bg-white overflow-hidden divide-y divide-border">
            {topics.map((topic) => (
              <TopicRow key={topic.syncId} topic={topic} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
