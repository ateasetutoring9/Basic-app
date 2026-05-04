import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = 'edge';

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

async function getCallerId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: UserUpdate = {};
  if (typeof body.email === "string") patch.email = body.email;
  if (body.display_name !== undefined) patch.display_name = (body.display_name as string) || null;
  if (typeof body.is_admin === "boolean") patch.is_admin = body.is_admin;

  if (typeof body.password === "string") {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    patch.password_hash = await bcrypt.hash(body.password, 12);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, sync_id, email, display_name, is_admin, created_at, email_verified_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const callerId = await getCallerId(req);
  if (callerId === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 403 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
