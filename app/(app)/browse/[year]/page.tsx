import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getYearByName, getSubjectsForYear } from "../_lib/loaders";
import { BreadcrumbNav } from "../_components/BreadcrumbNav";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  const yearObj = await getYearByName(year);
  if (!yearObj) return { title: "Browse — At Ease Learning" };
  return {
    title: `${yearObj.displayName} — At Ease Learning`,
    description: `Browse ${yearObj.displayName} subjects — free lectures and worksheets.`,
  };
}

export default async function YearPage({ params }: Props) {
  const { year } = await params;

  const yearObj = await getYearByName(year);
  if (!yearObj) notFound();

  const subjects = await getSubjectsForYear(yearObj.id);
  if (subjects.length === 0) notFound();

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BreadcrumbNav
          crumbs={[
            { label: "Browse", href: "/browse" },
            { label: yearObj.displayName },
          ]}
        />

        <h1 className="text-3xl font-bold text-fg mb-2">{yearObj.displayName}</h1>
        <p className="text-muted mb-8">Pick a subject to start.</p>

        <ul className="grid gap-4 sm:grid-cols-2">
          {subjects.map((subject) => (
            <li key={subject.syncId}>
              <Link
                href={`/browse/${year}/${subject.slug}`}
                className="group flex flex-col h-full rounded-xl border border-border bg-white p-6 hover:border-indigo-300 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <p className="font-semibold text-fg group-hover:text-primary transition-colors mb-1">
                  {subject.name}
                </p>
                <p className="text-sm text-muted mb-2">
                  {subject.topicCount} {subject.topicCount === 1 ? "topic" : "topics"}
                </p>
                {subject.previewTopics.length > 0 && (
                  <p className="text-xs text-muted truncate">
                    {subject.previewTopics.join(" · ")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
