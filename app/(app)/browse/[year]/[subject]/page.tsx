import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/PageContainer";

export const runtime = 'edge';

export const dynamic = "force-dynamic";

const FORMAT_BADGE: Record<string, { label: string; classes: string }> = {
  text:   { label: "Text",   classes: "bg-indigo-100 text-indigo-700" },
  video:  { label: "Video",  classes: "bg-red-100 text-red-700" },
  slides: { label: "Slides", classes: "bg-amber-100 text-amber-700" },
};

interface Props {
  params: { year: string; subject: string };
}

interface TopicRow {
  id: number;
  sync_id: string;
  title: string;
  description: string | null;
  lectures: { format: string; deleted_at: string | null }[];
}

async function getSubjectWithTopics(yearName: string, subjectSyncId: string) {
  const supabase = createServerClient();

  // Resolve the subject by sync_id, also pulling in the year to verify the URL matches
  const { data: subject } = await supabase
    .from("subjects")
    .select(`
      id, name, description, display_order, sync_id,
      years!inner ( name, display_name )
    `)
    .eq("sync_id", subjectSyncId)
    .eq("years.name", yearName)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!subject) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yr = Array.isArray((subject as any).years) ? (subject as any).years[0] : (subject as any).years;

  // Fetch published topics for this subject
  const { data: topics } = await supabase
    .from("topics")
    .select(`
      id, sync_id, title, description,
      lectures ( format, deleted_at )
    `)
    .eq("subject_id", subject.id)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("id");

  return {
    subject: {
      name: subject.name as string,
      description: subject.description as string | null,
      year: { name: yr.name as string, displayName: yr.display_name as string },
    },
    topics: (topics ?? []) as TopicRow[],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getSubjectWithTopics(params.year, params.subject);
  if (!result) return { title: "Topics" };
  const { subject } = result;
  return {
    title: `${subject.year.displayName} ${subject.name}`,
    description: `${subject.year.displayName} ${subject.name} topics on At Ease Learning — free lectures and worksheets.`,
  };
}

export default async function YearSubjectPage({ params }: Props) {
  const result = await getSubjectWithTopics(params.year, params.subject);
  if (!result) notFound();

  const { subject, topics } = result;

  return (
    <PageContainer as="main">
      <Link href={`/browse/${params.year}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors mb-6">
        ← {subject.year.displayName}
      </Link>

      <h1 className="text-3xl font-bold text-fg mb-2">
        {subject.year.displayName} — {subject.name}
      </h1>
      <p className="text-muted mb-8">
        {topics.length} topic{topics.length !== 1 ? "s" : ""}
      </p>

      {topics.length === 0 ? (
        <p className="text-muted">No topics available yet for this subject.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {topics.map((topic) => {
            const lecRow = Array.isArray(topic.lectures) ? topic.lectures[0] : topic.lectures;
            const lecture = lecRow && !lecRow.deleted_at ? lecRow : null;
            const badge = lecture ? FORMAT_BADGE[lecture.format] : null;

            return (
              <li key={topic.sync_id}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-white shadow-sm p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-base font-bold text-fg leading-snug">{topic.title}</h2>
                      {badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {topic.description && (
                      <p className="text-sm text-muted leading-relaxed line-clamp-2">{topic.description}</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {lecture ? (
                      <Link
                        href={`/learn/${topic.sync_id}`}
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[88px] px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                      >
                        Start
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center min-h-[44px] min-w-[88px] px-5 rounded-lg border border-border text-sm text-muted cursor-not-allowed">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
