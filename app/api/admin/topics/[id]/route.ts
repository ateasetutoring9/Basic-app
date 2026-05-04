import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = 'edge';

type TopicUpdate = Database["public"]["Tables"]["topics"]["Update"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const patch: TopicUpdate = {};
  if (body.subject_id !== undefined) patch.subject_id = body.subject_id;
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.thumbnail_url !== undefined) patch.thumbnail_url = body.thumbnail_url || null;
  if (body.is_published !== undefined) patch.is_published = body.is_published;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .update(patch)
    .eq("id", id)
    .select("id, sync_id, title, description, thumbnail_url, is_published, subject_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("topics")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
