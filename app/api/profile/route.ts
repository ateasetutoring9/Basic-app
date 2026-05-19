import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "edge";

type PersonUpdate = Database["public"]["Tables"]["people"]["Update"];

const VALID_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const supabase = createServerClient();

  const { data: person, error } = await supabase
    .from("people")
    .select(
      "sync_id, first_name, last_name, preferred_name, date_of_birth, phone_number, school_name, state, year_id, photo_url"
    )
    .eq("linked_user_id", auth.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!person) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let year_sync_id: string | null = null;
  if (person.year_id) {
    const { data: year } = await supabase
      .from("years")
      .select("sync_id")
      .eq("id", person.year_id)
      .maybeSingle();
    year_sync_id = year?.sync_id ?? null;
  }

  return NextResponse.json({ ...person, year_sync_id });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { first_name, last_name, preferred_name, date_of_birth, phone_number, school_name, state, year_sync_id, photo_url } =
    body as Record<string, string | null | undefined>;

  if (state && !VALID_STATES.includes(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const supabase = createServerClient();

  let year_id: number | null | undefined = undefined;
  if (year_sync_id !== undefined) {
    if (!year_sync_id) {
      year_id = null;
    } else {
      const { data: year } = await supabase
        .from("years")
        .select("id")
        .eq("sync_id", year_sync_id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!year) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
      year_id = year.id;
    }
  }

  const patch: PersonUpdate = { updated_by_id: auth.userId };
  if (first_name !== undefined) patch.first_name = first_name || null;
  if (last_name !== undefined) patch.last_name = last_name || null;
  if (preferred_name !== undefined) patch.preferred_name = preferred_name || null;
  if (date_of_birth !== undefined) patch.date_of_birth = date_of_birth || null;
  if (phone_number !== undefined) patch.phone_number = phone_number || null;
  if (school_name !== undefined) patch.school_name = school_name || null;
  if (state !== undefined) patch.state = state || null;
  if (year_id !== undefined) patch.year_id = year_id;
  if (photo_url !== undefined) patch.photo_url = photo_url || null;

  const { error } = await supabase
    .from("people")
    .update(patch)
    .eq("linked_user_id", auth.userId)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
