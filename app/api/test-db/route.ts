import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Temporary connection test — remove before deploying to production.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const checks: Record<string, unknown> = {
    NEXT_PUBLIC_SUPABASE_URL: url ? `set (${url.slice(0, 35)}…)` : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? "set" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? "set" : "MISSING — falling back to anon key",
  };

  // Step 1: can we reach the Supabase REST endpoint at all?
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: (serviceKey ?? anonKey) as string,
        Authorization: `Bearer ${serviceKey ?? anonKey}`,
      },
    });
    checks.supabase_reachable = res.ok
      ? `yes (HTTP ${res.status})`
      : `HTTP ${res.status} — ${await res.text()}`;
  } catch (err) {
    checks.supabase_reachable = `FAILED: ${(err as Error).message}`;
    return NextResponse.json({ ok: false, checks }, { status: 500 });
  }

  // Step 2: can we create the Supabase client?
  let client;
  try {
    client = createServerClient();
    checks.client = "created OK";
  } catch (err) {
    checks.client = `FAILED: ${(err as Error).message}`;
    return NextResponse.json({ ok: false, checks }, { status: 500 });
  }

  // Step 3: list public tables — tells us if the schema has been applied.
  const { data: tables, error: tablesError } = await client
    .rpc("list_public_tables")
    .select("*");

  if (tablesError) {
    // rpc not available — try a direct table query instead
    const { data, error } = await client
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      checks.users_table = `FAILED: ${error.message}`;
      checks.hint =
        error.message.includes("does not exist")
          ? "The v3 schema has not been applied to this Supabase project. Run the migration SQL in the Supabase SQL editor."
          : error.message.includes("permission") || error.message.includes("policy")
          ? "Permission denied — make sure SUPABASE_SERVICE_ROLE_KEY is set and correct."
          : "Unexpected error — check message above.";
      return NextResponse.json({ ok: false, checks }, { status: 500 });
    }

    checks.users_table = `reachable OK (${data?.length ?? 0} rows returned)`;
  } else {
    checks.public_tables = tables;
  }

  return NextResponse.json({ ok: true, checks });
}
