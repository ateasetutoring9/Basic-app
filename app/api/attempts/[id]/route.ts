import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const attemptId = parseInt(params.id, 10);
  if (isNaN(attemptId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createServerClient();

  // Fetch attempt — only if it belongs to the requesting user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, worksheet_id, score, total, answers, created_at, worksheet_history_id")
    .eq("id", attemptId)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single() as any;

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prefer questions from the exact historical version answered, fall back to current
  let questions: unknown[] = [];
  let worksheetTitle = "";

  if (attempt.worksheet_history_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hist } = await (supabase as any)
      .from("worksheets_history")
      .select("title, questions")
      .eq("id", attempt.worksheet_history_id)
      .single();
    if (hist) {
      worksheetTitle = hist.title;
      questions = hist.questions ?? [];
    }
  }

  if (!questions.length) {
    const { data: ws } = await supabase
      .from("worksheets")
      .select("title, questions, topic_id")
      .eq("id", attempt.worksheet_id)
      .is("deleted_at", null)
      .single();
    if (ws) {
      worksheetTitle = ws.title;
      questions = (ws.questions as unknown[]) ?? [];
    }
  }

  // Get topic sync_id for navigation links
  const { data: ws } = await supabase
    .from("worksheets")
    .select("topic_id")
    .eq("id", attempt.worksheet_id)
    .single();

  let topicSyncId: string | null = null;
  if (ws?.topic_id) {
    const { data: topic } = await supabase
      .from("topics")
      .select("sync_id")
      .eq("id", ws.topic_id)
      .single();
    topicSyncId = topic?.sync_id ?? null;
  }

  return NextResponse.json({
    id: attempt.id,
    score: attempt.score,
    total: attempt.total,
    answers: attempt.answers,
    created_at: attempt.created_at,
    topicSyncId,
    worksheet: {
      id: attempt.worksheet_id,
      title: worksheetTitle,
      questions,
    },
  });
}
