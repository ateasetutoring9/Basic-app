import { createServerClient } from "@/lib/supabase/server";

export function toSubjectSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export interface BrowseYear {
  id: number;
  syncId: string;
  name: string;
  displayName: string;
  subjectCount: number;
}

export interface BrowseSubject {
  id: number;
  syncId: string;
  name: string;
  slug: string;
  topicCount: number;
  previewTopics: string[];
}

export interface BrowseTopic {
  syncId: string;
  title: string;
  questionCount: number;
  hasLecture: boolean;
  attempted: boolean;
}

export async function getAllYears(): Promise<BrowseYear[]> {
  try {
    const supabase = createServerClient();

    const { data: years } = await supabase
      .from("years")
      .select("id, sync_id, name, display_name")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name");

    if (!years?.length) return [];

    const yearIds = years.map((y) => y.id);
    const { data: subjects } = await supabase
      .from("subjects")
      .select("year_id")
      .in("year_id", yearIds)
      .eq("is_active", true)
      .is("deleted_at", null);

    const countById = new Map<number, number>();
    for (const s of subjects ?? []) {
      countById.set(s.year_id, (countById.get(s.year_id) ?? 0) + 1);
    }

    return years.map((y) => ({
      id: y.id,
      syncId: y.sync_id,
      name: y.name,
      displayName: y.display_name,
      subjectCount: countById.get(y.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getYearByName(
  yearName: string
): Promise<{ id: number; name: string; displayName: string } | null> {
  try {
    const supabase = createServerClient();

    const { data } = await supabase
      .from("years")
      .select("id, name, display_name")
      .eq("name", yearName)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!data) return null;
    return { id: data.id, name: data.name, displayName: data.display_name };
  } catch {
    return null;
  }
}

export async function getSubjectsForYear(yearId: number): Promise<BrowseSubject[]> {
  try {
    const supabase = createServerClient();

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, sync_id, name")
      .eq("year_id", yearId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_order");

    if (!subjects?.length) return [];

    const subjectIds = subjects.map((s) => s.id);

    const { data: topics } = await supabase
      .from("topics")
      .select("subject_id, title")
      .in("subject_id", subjectIds)
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    const topicsById = new Map<number, string[]>();
    for (const t of topics ?? []) {
      const arr = topicsById.get(t.subject_id) ?? [];
      arr.push(t.title);
      topicsById.set(t.subject_id, arr);
    }

    return subjects.map((s) => {
      const titles = topicsById.get(s.id) ?? [];
      return {
        id: s.id,
        syncId: s.sync_id,
        name: s.name,
        slug: toSubjectSlug(s.name),
        topicCount: titles.length,
        previewTopics: titles.slice(0, 3),
      };
    });
  } catch {
    return [];
  }
}

export async function getSubjectByYearAndSlug(
  yearId: number,
  subjectSlug: string
): Promise<{ id: number; syncId: string; name: string } | null> {
  try {
    const supabase = createServerClient();

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, sync_id, name")
      .eq("year_id", yearId)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (!subjects?.length) return null;

    const match = subjects.find((s) => toSubjectSlug(s.name) === subjectSlug);
    if (!match) return null;

    return { id: match.id, syncId: match.sync_id, name: match.name };
  } catch {
    return null;
  }
}

export async function getTopicsForSubject(
  subjectId: number,
  userId: number
): Promise<BrowseTopic[]> {
  // TODO: add display_order column to topics for explicit teaching order
  try {
    const supabase = createServerClient();

    const { data: topics } = await supabase
      .from("topics")
      .select("id, sync_id, title")
      .eq("subject_id", subjectId)
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!topics?.length) return [];

    const topicIds = topics.map((t) => t.id);

    const [{ data: worksheets }, { data: lectures }] = await Promise.all([
      supabase
        .from("worksheets")
        .select("id, topic_id, questions")
        .in("topic_id", topicIds)
        .is("deleted_at", null),
      supabase
        .from("lectures")
        .select("topic_id")
        .in("topic_id", topicIds)
        .is("deleted_at", null),
    ]);

    const wsByTopicId = new Map((worksheets ?? []).map((w) => [w.topic_id, w]));
    const lectureTopicIds = new Set((lectures ?? []).map((l) => l.topic_id));

    const attemptedTopicIds = new Set<number>();
    const worksheetIds = (worksheets ?? []).map((w) => w.id);
    if (worksheetIds.length > 0) {
      const { data: attempts } = await supabase
        .from("attempts")
        .select("worksheet_id")
        .in("worksheet_id", worksheetIds)
        .eq("user_id", userId)
        .is("deleted_at", null);

      const wsToTopicId = new Map((worksheets ?? []).map((w) => [w.id, w.topic_id]));
      for (const a of attempts ?? []) {
        const topicId = wsToTopicId.get(a.worksheet_id);
        if (topicId !== undefined) attemptedTopicIds.add(topicId);
      }
    }

    return topics.map((t) => {
      const ws = wsByTopicId.get(t.id);
      const questionCount = ws && Array.isArray(ws.questions) ? ws.questions.length : 0;
      return {
        syncId: t.sync_id,
        title: t.title,
        questionCount,
        hasLecture: lectureTopicIds.has(t.id),
        attempted: attemptedTopicIds.has(t.id),
      };
    });
  } catch {
    return [];
  }
}
