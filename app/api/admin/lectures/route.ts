import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

// POST body: { topicId: number; title: string; format: "text"|"video"|"slides"; content: object|string }
// Upserts the lecture for the given topic.
export async function POST(req: Request) {
  const body = await req.json();
  const { topicId, title, format, content } = body;

  if (!topicId || !title || !format || content === undefined) {
    return NextResponse.json({ error: "topicId, title, format, and content are required" }, { status: 400 });
  }

  // Normalise content to the DB JSONB shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbContent: any;
  if (format === "text") {
    dbContent = { markdown: typeof content === "string" ? content : String(content) };
  } else if (format === "video") {
    dbContent = {
      youtube_id: content.youtubeId ?? content.youtube_id ?? "",
      ...(content.durationSeconds != null ? { duration_seconds: content.durationSeconds } : {}),
    };
  } else {
    // slides
    dbContent = { html: typeof content === "string" ? content : String(content.html ?? "") };
  }

  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("lectures")
    .select("id")
    .eq("topic_id", topicId)
    .is("deleted_at", null)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("lectures")
      .update({ title, format, content: dbContent })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("lectures")
      .insert({ topic_id: topicId, title, format, content: dbContent });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
