import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

type PersonUpdate = Database["public"]["Tables"]["people"]["Update"];

export const runtime = "edge";

const VALID_STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ syncId: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "read", "person");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const { syncId } = await params;
  const supabase = createServerClient();

  const { data: person, error } = await supabase
    .from("people")
    .select(
      "sync_id, import_email, first_name, last_name, preferred_name, date_of_birth, phone_number, school_name, state, year_id, photo_url, linked_user_id"
    )
    .eq("sync_id", syncId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve year_sync_id
  let year_sync_id: string | null = null;
  if (person.year_id) {
    const { data: year } = await supabase
      .from("years")
      .select("sync_id")
      .eq("id", person.year_id)
      .maybeSingle();
    year_sync_id = year?.sync_id ?? null;
  }

  // Resolve linked user email
  let linked_user_email: string | null = null;
  if (person.linked_user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", person.linked_user_id)
      .is("deleted_at", null)
      .maybeSingle();
    linked_user_email = user?.email ?? null;
  }

  return NextResponse.json({
    sync_id: person.sync_id,
    import_email: person.import_email,
    first_name: person.first_name,
    last_name: person.last_name,
    preferred_name: person.preferred_name,
    date_of_birth: person.date_of_birth,
    phone_number: person.phone_number,
    school_name: person.school_name,
    state: person.state,
    year_sync_id,
    photo_url: person.photo_url,
    linked_user_email,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ syncId: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "update", "person");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const { syncId } = await params;

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

  // Resolve year
  let year_id: number | null | undefined = undefined;
  if (year_sync_id !== undefined) {
    if (year_sync_id === null || year_sync_id === "") {
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
  if (import_email !== undefined) patch.import_email = import_email || null;
  if (first_name !== undefined) patch.first_name = first_name || null;
  if (last_name !== undefined) patch.last_name = last_name || null;
  if (preferred_name !== undefined) patch.preferred_name = preferred_name || null;
  if (date_of_birth !== undefined) patch.date_of_birth = date_of_birth || null;
  if (phone_number !== undefined) patch.phone_number = phone_number || null;
  if (school_name !== undefined) patch.school_name = school_name || null;
  if (state !== undefined) patch.state = state || null;
  if (year_id !== undefined) patch.year_id = year_id;
  if (photo_url !== undefined) patch.photo_url = photo_url || null;

  const { data, error } = await supabase
    .from("people")
    .update(patch)
    .eq("sync_id", syncId)
    .is("deleted_at", null)
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
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
