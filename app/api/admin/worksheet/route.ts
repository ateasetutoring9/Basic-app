import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = 'edge';

type WorksheetUpdate = Database["public"]["Tables"]["worksheets"]["Update"];

// GET ?topicId=<number> — returns { worksheet, attemptCount }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicId = parseInt(searchParams.get("topicId") ?? "", 10);
  if (isNaN(topicId)) return NextResponse.json({ error: "Missing topicId" }, { status: 400 });

  const supabase = createServerClient();

  const { data: ws } = await supabase
    .from("worksheets")
    .select("id, sync_id, title, questions, difficulty, is_published")
    .eq("topic_id", topicId)
    .is("deleted_at", null)
    .single();

  if (!ws) return NextResponse.json({ worksheet: null, attemptCount: 0 });

  const { count } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("worksheet_id", ws.id)
    .is("deleted_at", null);

  return NextResponse.json({ worksheet: ws, attemptCount: count ?? 0 });
}

// POST body: { topicId, topicSyncId, title, questions, difficulty?, isPublished? }
// Upserts the worksheet for the given topic.
export async function POST(req: Request) {
  const body = await req.json();
  const {
    topicId,
    title,
    questions,
    difficulty = 1,
    isPublished,
  } = body;

  if (!topicId || !title || !Array.isArray(questions)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("worksheets")
    .select("id")
    .eq("topic_id", topicId)
    .is("deleted_at", null)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: WorksheetUpdate = { title, questions: questions as any, difficulty };
  if (isPublished !== undefined) patch.is_published = isPublished;

  if (existing) {
    const { error } = await supabase
      .from("worksheets")
      .update(patch)
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("worksheets")
      .insert({ topic_id: topicId, title, questions, difficulty, is_published: isPublished ?? false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE ?topicSyncId=<uuid> — soft-deletes the worksheet for the given topic
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicSyncId = searchParams.get("topicSyncId");

  if (!topicSyncId) {
    return NextResponse.json({ error: "Missing topicSyncId" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("sync_id", topicSyncId)
    .single();

  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const { error } = await supabase
    .from("worksheets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("topic_id", topic.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
