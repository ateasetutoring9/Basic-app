import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";

export const runtime = 'edge';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "read", "admin_dashboard");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("sync_id, name, display_name, description")
    .is("deleted_at", null)
    .order("display_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
