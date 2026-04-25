import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-side client. Uses the service role key so it bypasses row-level
// policies (there are none in v3, but this is the correct key for server use).
// Never import this in client components — use lib/supabase/client.ts instead.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient<Database>(url.replace(/\/$/, ""), key);
}
