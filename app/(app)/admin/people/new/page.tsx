import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { userCan } from "@/lib/auth/permissions";
import { createServerClient } from "@/lib/supabase/server";
import { PersonForm } from "../_components/PersonForm";

export const runtime = "edge";

export default async function NewPersonPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) redirect("/login");

  const canCreate = await userCan(session, "create", "person");
  if (!canCreate) redirect("/admin/people");

  const supabase = createServerClient();
  const { data: yearsRaw } = await supabase
    .from("years")
    .select("sync_id, display_name")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("display_order" as never);

  const years = (yearsRaw ?? []).map((y) => ({
    sync_id: y.sync_id,
    display_name: y.display_name,
  }));

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/people" className="text-sm text-muted hover:text-fg transition-colors">
          ← People
        </Link>
        <h1 className="text-3xl font-bold text-fg mt-2">New Person</h1>
        <p className="text-muted mt-1">Create a new person record.</p>
      </div>

      <PersonForm mode="create" years={years} />
    </main>
  );
}
