import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Browser-side client. Uses the anon key for public reads.
// Auth is handled by the API layer — do not call supabase.auth.* here.
export function createClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
