import { createServerClient } from "@/lib/supabase/server";
import type { InProgressTopic, RecommendedTopic, DashboardSubject, RecentAttempt } from "./types";

export async function getInProgressTopics(userId: number): Promise<InProgressTopic[]> {
  try {
    const supabase = createServerClient();

    const { data: attempts } = await supabase
      .from("attempts")
      .select("id, worksheet_id, score, total, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!attempts?.length) return [];

    const worksheetIds = [...new Set(attempts.map((a) => a.worksheet_id))];
    const { data: worksheets } = await supabase
      .from("worksheets")
      .select("id, sync_id, topic_id")
      .in("id", worksheetIds)
      .is("deleted_at", null);

    if (!worksheets?.length) return [];

    const topicIds = [...new Set(worksheets.map((w) => w.topic_id))];
    const { data: topics } = await supabase
      .from("topics")
      .select("id, sync_id, title, subject_id")
      .in("id", topicIds)
      .eq("is_published", true)
      .is("deleted_at", null);

    if (!topics?.length) return [];

    const subjectIds = [...new Set(topics.map((t) => t.subject_id))];
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, year_id")
      .in("id", subjectIds)
      .is("deleted_at", null);

    if (!subjects?.length) return [];

    const yearIds = [...new Set(subjects.map((s) => s.year_id))];
    const { data: years } = await supabase
      .from("years")
      .select("id, name, display_name")
      .in("id", yearIds)
      .is("deleted_at", null);

    const wsById = new Map(worksheets.map((w) => [w.id, w]));
    const wsByTopicId = new Map(worksheets.map((w) => [w.topic_id, w]));
    const topicById = new Map(topics.map((t) => [t.id, t]));
    const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
    const yearById = new Map((years ?? []).map((y) => [y.id, y]));

    // Walk attempts newest-first, keep the first (most recent) attempt per topic.
    // Skip topics where the most recent attempt is a perfect score.
    const seenTopics = new Set<number>();
    const result: InProgressTopic[] = [];

    for (const attempt of attempts) {
      const ws = wsById.get(attempt.worksheet_id);
      if (!ws) continue;
      const topic = topicById.get(ws.topic_id);
      if (!topic || seenTopics.has(topic.id)) continue;
      seenTopics.add(topic.id);

      if (attempt.score >= attempt.total) continue;

      const subject = subjectById.get(topic.subject_id);
      if (!subject) continue;
      const year = yearById.get(subject.year_id);
      if (!year) continue;

      result.push({
        topicSyncId: topic.sync_id,
        topicTitle: topic.title,
        subjectName: subject.name,
        yearName: year.name,
        worksheetSyncId: wsByTopicId.get(topic.id)?.sync_id ?? null,
        latestScore: attempt.score,
        latestTotal: attempt.total,
      });

      if (result.length >= 4) break;
    }

    return result;
  } catch {
    return [];
  }
}

export async function getRecommendedTopics(limit = 3): Promise<RecommendedTopic[]> {
  // TODO: replace with curated recommendation list per year-level
  // TODO: accept yearId and filter once year_id exists on the users table
  try {
    const supabase = createServerClient();

    const { data: topics } = await supabase
      .from("topics")
      .select("sync_id, title, subject_id")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!topics?.length) return [];

    const subjectIds = topics.map((t) => t.subject_id);
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds)
      .is("deleted_at", null);

    const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));

    return topics
      .map((t) => ({
        topicSyncId: t.sync_id,
        topicTitle: t.title,
        subjectName: subjectById.get(t.subject_id)?.name ?? "",
      }))
      .filter((t) => t.subjectName !== "");
  } catch {
    return [];
  }
}

export async function getUserSubjects(): Promise<DashboardSubject[]> {
  // TODO: accept userId and filter by user's year level once year_id exists on users table
  // TODO: filter by user-selected subjects once subject selection exists in user model
  try {
    const supabase = createServerClient();

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, sync_id, name, year_id, years(name)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_order");

    if (!subjects?.length) return [];

    const subjectIds = subjects.map((s) => s.id);
    const { data: topicRows } = await supabase
      .from("topics")
      .select("subject_id")
      .in("subject_id", subjectIds)
      .eq("is_published", true)
      .is("deleted_at", null);

    const countById = new Map<number, number>();
    for (const t of topicRows ?? []) {
      countById.set(t.subject_id, (countById.get(t.subject_id) ?? 0) + 1);
    }

    return subjects.map((s) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yr = Array.isArray((s as any).years) ? (s as any).years[0] : (s as any).years;
      return {
        syncId: s.sync_id,
        name: s.name,
        yearName: (yr?.name as string) ?? "",
        topicCount: countById.get(s.id) ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export async function getRecentAttempts(userId: number, limit = 3): Promise<RecentAttempt[]> {
  try {
    const supabase = createServerClient();

    const { data: attempts } = await supabase
      .from("attempts")
      .select("id, worksheet_id, score, total, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!attempts?.length) return [];

    const worksheetIds = attempts.map((a) => a.worksheet_id);
    const { data: worksheets } = await supabase
      .from("worksheets")
      .select("id, topic_id")
      .in("id", worksheetIds)
      .is("deleted_at", null);

    const topicIds = (worksheets ?? []).map((w) => w.topic_id);
    const { data: topics } = await supabase
      .from("topics")
      .select("id, title, subject_id")
      .in("id", topicIds)
      .is("deleted_at", null);

    const subjectIds = (topics ?? []).map((t) => t.subject_id);
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds)
      .is("deleted_at", null);

    const wsById = new Map((worksheets ?? []).map((w) => [w.id, w]));
    const topicById = new Map((topics ?? []).map((t) => [t.id, t]));
    const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));

    return attempts
      .map((a) => {
        const ws = wsById.get(a.worksheet_id);
        const topic = ws ? topicById.get(ws.topic_id) : null;
        const subject = topic ? subjectById.get(topic.subject_id) : null;
        return {
          attemptId: a.id,
          topicTitle: topic?.title ?? "",
          subjectName: subject?.name ?? "",
          score: a.score,
          total: a.total,
          createdAt: a.created_at,
        };
      })
      .filter((a) => a.topicTitle !== "");
  } catch {
    return [];
  }
}
