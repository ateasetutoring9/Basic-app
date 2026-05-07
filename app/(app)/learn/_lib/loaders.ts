import { createServerClient } from "@/lib/supabase/server";
import type { LearnTopic, LearnLecture, LearnLectureContent, WorksheetMeta, CommentNode } from "./types";

export async function getTopicWithLecture(syncId: string): Promise<LearnTopic | null> {
  try {
    const supabase = createServerClient();

    const { data: topic } = await supabase
      .from("topics")
      .select(`
        id, sync_id, title,
        subjects ( name, years ( name, display_name ) ),
        lectures ( format, title, content, is_published, deleted_at )
      `)
      .eq("sync_id", syncId)
      .eq("is_published", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!topic) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectRow = Array.isArray((topic as any).subjects) ? (topic as any).subjects[0] : (topic as any).subjects;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yearRow = Array.isArray(subjectRow?.years) ? subjectRow.years[0] : subjectRow?.years;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lecRow = Array.isArray((topic as any).lectures) ? (topic as any).lectures[0] : (topic as any).lectures;

    let lecture: LearnLecture | null = null;
    if (lecRow && !lecRow.deleted_at) {
      const c = lecRow.content as Record<string, unknown>;
      let content: LearnLectureContent;

      if (lecRow.format === "video") {
        content = {
          format: "video",
          youtubeId: c.youtube_id as string,
          durationSeconds: c.duration_seconds as number | undefined,
        };
      } else if (lecRow.format === "slides") {
        content = { format: "slides", html: c.html as string };
      } else {
        content = { format: "text", markdown: c.markdown as string };
      }

      lecture = {
        title: lecRow.title as string,
        isPublished: lecRow.is_published as boolean,
        content,
      };
    }

    return {
      id: topic.id,
      syncId: topic.sync_id,
      title: topic.title,
      subject: {
        name: subjectRow?.name as string,
        yearName: yearRow?.name as string,
        yearDisplayName: yearRow?.display_name as string,
      },
      lecture,
    };
  } catch {
    return null;
  }
}

export async function getWorksheetMetaForTopic(
  topicId: number,
  userId?: number
): Promise<WorksheetMeta | null> {
  try {
    const supabase = createServerClient();

    const { data: ws } = await supabase
      .from("worksheets")
      .select("id, sync_id, questions, is_published")
      .eq("topic_id", topicId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!ws) return null;

    const questionCount = Array.isArray(ws.questions) ? ws.questions.length : 0;

    let bestAttempt: { score: number; total: number } | null = null;
    if (userId !== undefined) {
      const { data: attempt } = await supabase
        .from("attempts")
        .select("score, total")
        .eq("worksheet_id", ws.id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attempt) bestAttempt = { score: attempt.score, total: attempt.total };
    }

    return {
      syncId: ws.sync_id,
      questionCount,
      isPublished: ws.is_published,
      bestAttempt,
    };
  } catch {
    return null;
  }
}

export async function getCommentCountForTopic(topicId: number): Promise<number> {
  try {
    const supabase = createServerClient();

    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId)
      .eq("is_hidden", false)
      .is("deleted_at", null);

    return count ?? 0;
  } catch {
    return 0;
  }
}

interface FlatComment {
  id: number;
  parentId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
}

function buildCommentTree(flat: FlatComment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  const roots: CommentNode[] = [];
  for (const c of flat) {
    const node = map.get(c.id)!;
    if (!c.parentId) {
      roots.push(node);
    } else {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node); // orphan → treat as root
      }
    }
  }
  return roots;
}

export async function getCommentsForTopic(topicId: number): Promise<CommentNode[]> {
  try {
    const supabase = createServerClient();

    const { data: rawData } = await supabase
      .from("comments")
      .select("id, parent_comment_id, body, created_at, users ( display_name, email )")
      .eq("topic_id", topicId)
      .eq("is_hidden", false)
      .is("deleted_at", null)
      .order("id", { ascending: true });

    if (!rawData?.length) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawData as any[];

    const flat: FlatComment[] = data.map((c) => {
      const u = Array.isArray(c.users) ? c.users[0] : c.users;
      const displayName = (u?.display_name as string | null) ?? null;
      const email = (u?.email as string) ?? "";
      return {
        id: c.id,
        parentId: c.parent_comment_id ?? null,
        authorName: displayName ?? email.split("@")[0] ?? "Student",
        body: c.body,
        createdAt: c.created_at,
      };
    });

    return buildCommentTree(flat);
  } catch {
    return [];
  }
}
