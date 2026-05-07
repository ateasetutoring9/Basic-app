import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

// POST body: { topicId, title, format, content, is_published? }
// Upserts the lecture for the given topic.
// Returns { ok: true, id: number } so the client can store the lecture ID on first create.
export async function POST(req: Request) {
  const body = await req.json();
  const { topicId, title, format, content, is_published } = body;

  if (!topicId || !title || !format || content === undefined) {
    return NextResponse.json({ error: "topicId, title, format, and content are required" }, { status: 400 });
  }

  // Default to publishing when saving unless caller explicitly passes false
  const published: boolean = is_published === false ? false : true;

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
    dbContent = { html: typeof content === "string" ? content : String(content.html ?? "") };
  }

  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("lectures")
    .select("id, published_at")
    .eq("topic_id", topicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    // Set published_at on first publish; preserve it on all subsequent saves
    const publishedAt = published && !existing.published_at
      ? new Date().toISOString()
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("lectures").update({
      title,
      format,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: dbContent as any,
      is_published: published,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).eq("id", existing.id) as any);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: existing.id });
  } else {
    const publishedAt = published ? new Date().toISOString() : undefined;

    const { data: inserted, error } = await supabase
      .from("lectures")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        topic_id: topicId,
        title,
        format,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: dbContent as any,
        is_published: published,
        ...(publishedAt ? { published_at: publishedAt } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: inserted?.id ?? null });
  }
}

// PATCH body: { id: number; is_published: boolean }
// Only flips the publish flag — never touches content.
// Sets published_at when publishing for the first time; never clears it on unpublish.
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, is_published } = body;

  if (typeof id !== "number" || typeof is_published !== "boolean") {
    return NextResponse.json({ error: "id (number) and is_published (boolean) are required" }, { status: 400 });
  }

  const supabase = createServerClient();

  let publishedAt: string | undefined;
  if (is_published) {
    // Only set published_at if never published before (preserves original first-publish date)
    const { data: existing } = await supabase
      .from("lectures")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (existing && !existing.published_at) {
      publishedAt = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("lectures")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      is_published,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
