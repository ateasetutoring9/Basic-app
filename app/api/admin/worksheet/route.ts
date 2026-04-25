import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST body: { topicId: number; topicSyncId: string; title: string; questions: Question[] }
export async function POST(req: Request) {
  const body = await req.json();
  const { topicId, title, questions } = body;

  if (!topicId || !title || !Array.isArray(questions)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert: if a worksheet already exists for this topic, update it; otherwise insert.
  const { data: existing } = await supabase
    .from("worksheets")
    .select("id")
    .eq("topic_id", topicId)
    .is("deleted_at", null)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("worksheets")
      .update({ title, questions })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("worksheets")
      .insert({ topic_id: topicId, title, questions, difficulty: 1 });
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

  // Resolve topic sync_id → id
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("sync_id", topicSyncId)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("worksheets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("topic_id", topic.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
