import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("*, years ( id, name, display_name )")
    .is("deleted_at", null)
    .order("display_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { year_id, name, description, display_order = 0, is_active = true } = await req.json();
  if (!year_id || !name) {
    return NextResponse.json({ error: "year_id and name are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subjects")
    .insert({ year_id, name, description: description || null, display_order, is_active })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
