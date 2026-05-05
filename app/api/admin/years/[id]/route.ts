import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = 'edge';

type YearUpdate = Database["public"]["Tables"]["years"]["Update"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const patch: YearUpdate = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.display_name !== undefined) patch.display_name = body.display_name;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("years")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
