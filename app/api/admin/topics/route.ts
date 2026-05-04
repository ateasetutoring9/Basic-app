import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

// Admin GET returns ALL topics (published + draft), unlike the public loader.
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select(`
      id, sync_id, title, description, thumbnail_url, is_published,
      subjects ( id, sync_id, name, years ( id, display_name ) )
    `)
    .is("deleted_at", null)
    .order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Normalise to the camelCase shape the admin pages expect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (data ?? []).map((t: any) => {
    const sub = Array.isArray(t.subjects) ? t.subjects[0] : t.subjects;
    const yr = sub ? (Array.isArray(sub.years) ? sub.years[0] : sub.years) : null;
    return {
      id: t.id,
      syncId: t.sync_id,
      title: t.title,
      description: t.description,
      thumbnailUrl: t.thumbnail_url,
      isPublished: t.is_published,
      subject: sub
        ? { id: sub.id, syncId: sub.sync_id, name: sub.name, year: yr ? { displayName: yr.display_name } : null }
        : null,
    };
  });
  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const { subject_id, title, description, thumbnail_url, is_published = false } = await req.json();
  if (!subject_id || !title) {
    return NextResponse.json({ error: "subject_id and title are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .insert({
      subject_id,
      title,
      description: description || null,
      thumbnail_url: thumbnail_url || null,
      is_published,
    })
    .select("id, sync_id, title, description, thumbnail_url, is_published, subject_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
