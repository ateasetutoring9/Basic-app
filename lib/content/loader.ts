import { createClient } from "@supabase/supabase-js";
import type { Subject, YearLevel, Topic, Lecture, Worksheet, Question } from "./types";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const TOPIC_SELECT = `
  id,
  subject_slug,
  year_level,
  slug,
  title,
  description,
  order_index,
  lectures ( format, content, deleted_at ),
  worksheets ( id, title, questions, deleted_at )
` as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Topic {
  const subject = row.subject_slug as Subject;
  const year = row.year_level as YearLevel;
  const slug = row.slug as string;

  const base = {
    id: row.id as string,
    subject,
    year,
    topicSlug: slug,
    title: row.title as string,
    description: (row.description ?? "") as string,
    orderIndex: row.order_index as number,
  };

  let lecture: Lecture | undefined;
  const lecRow = Array.isArray(row.lectures) ? row.lectures[0] : row.lectures;
  if (lecRow && !lecRow.deleted_at) {
    const c = lecRow.content as Record<string, unknown>;
    if (lecRow.format === "video") {
      lecture = {
        ...base,
        format: "video",
        content: {
          youtubeId: c.youtube_id as string,
          durationSeconds: c.duration_seconds as number | undefined,
        },
      };
    } else if (lecRow.format === "slides") {
      lecture = { ...base, format: "slides", content: c.html as string };
    } else {
      lecture = { ...base, format: "text", content: c.markdown as string };
    }
  }

  let worksheet: Worksheet | undefined;
  const wsRow = Array.isArray(row.worksheets) ? row.worksheets[0] : row.worksheets;
  if (wsRow && !wsRow.deleted_at) {
    worksheet = {
      id: wsRow.id as string,
      subject,
      year,
      topicSlug: slug,
      title: wsRow.title as string,
      questions: wsRow.questions as Question[],
    };
  }

  return {
    subject,
    year,
    slug,
    title: row.title as string,
    description: (row.description ?? "") as string,
    orderIndex: row.order_index as number,
    lecture,
    worksheet,
  };
}

export async function getAllTopics(): Promise<Topic[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_SELECT)
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("order_index");

  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getTopic(
  subject: Subject,
  year: YearLevel,
  slug: string
): Promise<Topic | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_SELECT)
    .is("deleted_at", null)
    .eq("is_published", true)
    .eq("subject_slug", subject)
    .eq("year_level", year)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function getSubjects(): Promise<
  { subject: Subject; yearCounts: Partial<Record<YearLevel, number>> }[]
> {
  const topics = await getAllTopics();
  const map = new Map<Subject, Partial<Record<YearLevel, number>>>();

  for (const topic of topics) {
    if (!map.has(topic.subject)) map.set(topic.subject, {});
    const yc = map.get(topic.subject)!;
    yc[topic.year] = (yc[topic.year] ?? 0) + 1;
  }

  return Array.from(map.entries()).map(([subject, yearCounts]) => ({
    subject,
    yearCounts,
  }));
}
