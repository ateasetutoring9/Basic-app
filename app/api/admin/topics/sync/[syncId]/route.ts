import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

const TOPIC_SELECT = `
  id, sync_id, title, description, thumbnail_url, is_published,
  subjects (
    id, sync_id, name,
    years ( id, sync_id, name, display_name )
  ),
  lectures (
    id, format, title, content, is_published, deleted_at
  ),
  worksheets (
    id, sync_id, title, questions, difficulty, is_published, deleted_at
  )
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ syncId: string }> }
) {
  const { syncId } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_SELECT)
    .is("deleted_at", null)
    .eq("sync_id", syncId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = data as any;
  const sub = Array.isArray(t.subjects) ? t.subjects[0] : t.subjects;
  const yr = sub ? (Array.isArray(sub.years) ? sub.years[0] : sub.years) : null;
  const lecRow = Array.isArray(t.lectures) ? t.lectures[0] : t.lectures;
  const wsRow = Array.isArray(t.worksheets) ? t.worksheets[0] : t.worksheets;

  const lecture =
    lecRow && !lecRow.deleted_at
      ? {
          id: lecRow.id,
          format: lecRow.format,
          title: lecRow.title,
          content: lecRow.content,
          isPublished: lecRow.is_published,
        }
      : null;

  const worksheet =
    wsRow && !wsRow.deleted_at
      ? {
          id: wsRow.id,
          syncId: wsRow.sync_id,
          title: wsRow.title,
          questions: wsRow.questions,
          difficulty: wsRow.difficulty,
          isPublished: wsRow.is_published,
        }
      : null;

  return NextResponse.json({
    id: t.id,
    syncId: t.sync_id,
    title: t.title,
    description: t.description,
    thumbnailUrl: t.thumbnail_url,
    isPublished: t.is_published,
    subject: sub
      ? {
          id: sub.id,
          syncId: sub.sync_id,
          name: sub.name,
          year: yr ? { id: yr.id, syncId: yr.sync_id, name: yr.name, displayName: yr.display_name } : null,
        }
      : null,
    lecture,
    worksheet,
  });
}
