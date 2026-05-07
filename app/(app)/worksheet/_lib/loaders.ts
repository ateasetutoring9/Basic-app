import { createServerClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/content/types";
import type { WorksheetData, NextTopic } from "./types";

export async function getWorksheetBySyncId(syncId: string): Promise<WorksheetData | null> {
  try {
    const supabase = createServerClient();

    const { data: ws } = await supabase
      .from("worksheets")
      .select(`
        id, sync_id, title, questions, difficulty,
        topics (
          id, sync_id, title,
          subjects (
            id, name,
            years ( name, display_name )
          )
        )
      `)
      .eq("sync_id", syncId)
      .eq("is_published", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!ws) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicRow = Array.isArray((ws as any).topics) ? (ws as any).topics[0] : (ws as any).topics;
    if (!topicRow) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectRow = Array.isArray(topicRow.subjects) ? topicRow.subjects[0] : topicRow.subjects;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yearRow = Array.isArray(subjectRow?.years) ? subjectRow.years[0] : subjectRow?.years;

    return {
      id: ws.id,
      syncId: ws.sync_id,
      title: ws.title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: ws.questions as unknown as Question[],
      difficulty: ws.difficulty,
      topic: {
        id: topicRow.id as number,
        syncId: topicRow.sync_id as string,
        title: topicRow.title as string,
        subject: {
          id: subjectRow?.id as number,
          name: subjectRow?.name as string,
          yearName: yearRow?.name as string,
          yearDisplayName: yearRow?.display_name as string,
        },
      },
    };
  } catch {
    return null;
  }
}

export async function getNextTopicInSubject(
  subjectId: number,
  currentTopicId: number
): Promise<NextTopic | null> {
  try {
    const supabase = createServerClient();

    const { data } = await supabase
      .from("topics")
      .select("sync_id, title")
      .eq("subject_id", subjectId)
      .eq("is_published", true)
      .is("deleted_at", null)
      .gt("id", currentTopicId)
      .order("id")
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return { syncId: data.sync_id, title: data.title };
  } catch {
    return null;
  }
}
