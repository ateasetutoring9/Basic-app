import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SubjectUpdate = Database["public"]["Tables"]["subjects"]["Update"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const patch: SubjectUpdate = {};
  if (body.year_id !== undefined) patch.year_id = body.year_id;
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.display_order !== undefined) patch.display_order = body.display_order;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subjects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
