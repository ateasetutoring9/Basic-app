import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("years")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { name, display_name, is_active = true } = await req.json();
  if (!name || !display_name) {
    return NextResponse.json({ error: "name and display_name are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("years")
    .insert({ name, display_name, is_active })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
