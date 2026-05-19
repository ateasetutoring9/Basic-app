import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";
import { generateToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { emailVerificationEmail } from "@/lib/email/templates/email-verification";
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from "@/lib/auth/policy";
import type { Database } from "@/lib/supabase/database.types";

type PersonUpdate = Database["public"]["Tables"]["people"]["Update"];

export const runtime = "edge";

export async function POST(req: Request) {
  let email: string, password: string, displayName: string | undefined;

  try {
    ({ email, password, displayName } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check for existing account
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[signup] DB lookup error:", lookupError.message, lookupError.details);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const password_hash = bcrypt.hashSync(password, 12);

  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({
      email,
      password_hash,
      ...(displayName ? { display_name: displayName } : {}),
    })
    .select("id, sync_id, email, is_admin, display_name")
    .single();

  if (insertError || !user) {
    console.error("[signup] DB insert error:", insertError?.message, insertError?.details);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // --- Person + role setup (simulated transaction via manual rollback) ---

  async function rollbackUser() {
    await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", user!.id);
  }

  // Look up default role
  const { data: defaultRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("is_default_for_signup", true)
    .is("deleted_at", null)
    .limit(1);

  if (roleError || !defaultRole?.length) {
    await rollbackUser();
    console.error("[signup] No default signup role found:", roleError?.message);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
  const defaultRoleId = defaultRole[0].id;

  // Find person record pre-loaded from bulk import (import_email match, not yet linked)
  const { data: matchedPeople } = await supabase
    .from("people")
    .select("id, first_name, last_name")
    .eq("import_email", email)
    .is("linked_user_id", null)
    .is("deleted_at", null)
    .limit(1);

  const matchedPerson = matchedPeople?.[0] ?? null;

  if (matchedPerson) {
    // Link existing person; loose-merge nulls from signup form
    const personUpdate: PersonUpdate = {
      linked_user_id: user.id,
      updated_by_id: user.id,
    };
    // Signup form currently provides no first/last name — left for future form fields
    const { error: linkError } = await supabase
      .from("people")
      .update(personUpdate)
      .eq("id", matchedPerson.id);

    if (linkError) {
      await rollbackUser();
      console.error("[signup] Failed to link person:", linkError.message);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
  } else {
    // No prior import — create a fresh person record linked to this user
    const { error: personError } = await supabase
      .from("people")
      .insert({
        linked_user_id: user.id,
        created_by_id: user.id,
        updated_by_id: user.id,
      });

    if (personError) {
      await rollbackUser();
      console.error("[signup] Failed to create person:", personError.message);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
  }

  // Assign default role
  const { error: roleAssignError } = await supabase
    .from("user_roles")
    .insert({
      user_id: user.id,
      role_id: defaultRoleId,
      created_by_id: user.id,
    });

  if (roleAssignError) {
    await rollbackUser();
    console.error("[signup] Failed to assign default role:", roleAssignError.message);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // --- End person + role setup ---

  const token = await signToken({
    userId: user.id,
    syncId: user.sync_id,
    email: user.email,
    isAdmin: user.is_admin,
  });

  const res = NextResponse.json(
    { syncId: user.sync_id, email: user.email, isAdmin: user.is_admin },
    { status: 201 }
  );
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

  // Send verification email fire-and-forget — never block the signup response
  void (async () => {
    try {
      const { raw, hash } = await generateToken();
      const expiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
      ).toISOString();

      await supabase
        .from("users")
        .update({
          email_verification_token: hash,
          email_verification_expires_at: expiresAt,
          email_verification_sent_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      const verifyUrl = `${appUrl}/verify-email?token=${raw}`;
      const { subject, html, text } = emailVerificationEmail({
        verifyUrl,
        firstName: user.display_name ?? undefined,
      });

      void sendEmail({ to: user.email, subject, html, text });
    } catch (err) {
      console.error("[signup] Failed to send verification email:", err);
    }
  })();

  return res;
}
