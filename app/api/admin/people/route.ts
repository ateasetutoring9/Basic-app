import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";

export const runtime = "edge";

const VALID_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "create", "person");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    import_email,
    first_name,
    last_name,
    preferred_name,
    date_of_birth,
    phone_number,
    school_name,
    state,
    year_sync_id,
    photo_url,
  } = body as Record<string, string | null | undefined>;

  if (state && !VALID_STATES.includes(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const supabase = createServerClient();

  let year_id: number | null = null;
  if (year_sync_id) {
    const { data: year } = await supabase
      .from("years")
      .select("id")
      .eq("sync_id", year_sync_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!year) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    year_id = year.id;
  }

  const { data, error } = await supabase
    .from("people")
    .insert({
      import_email: import_email || null,
      first_name: first_name || null,
      last_name: last_name || null,
      preferred_name: preferred_name || null,
      date_of_birth: date_of_birth || null,
      phone_number: phone_number || null,
      school_name: school_name || null,
      state: state || null,
      year_id,
      photo_url: photo_url || null,
      created_by_id: auth.userId,
      updated_by_id: auth.userId,
    })
    .select("sync_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A person with that import email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
