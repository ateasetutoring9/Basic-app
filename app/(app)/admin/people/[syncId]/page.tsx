import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { userCan } from "@/lib/auth/permissions";
import { createServerClient } from "@/lib/supabase/server";
import { PersonForm } from "../_components/PersonForm";

export const runtime = "edge";

interface Props {
  params: Promise<{ syncId: string }>;
}

export default async function EditPersonPage({ params }: Props) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) redirect("/login");

  const canRead = await userCan(session, "read", "person");
  if (!canRead) redirect("/admin");

  const { syncId } = await params;
  const supabase = createServerClient();

  // Fetch person, years in parallel
  const [personResult, yearsResult] = await Promise.all([
    supabase
      .from("people")
      .select(
        "sync_id, import_email, first_name, last_name, preferred_name, date_of_birth, phone_number, school_name, state, year_id, photo_url, linked_user_id"
      )
      .eq("sync_id", syncId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("years")
      .select("sync_id, display_name")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_order" as never),
  ]);

  if (!personResult.data) notFound();
  const person = personResult.data;

  const years = (yearsResult.data ?? []).map((y) => ({
    sync_id: y.sync_id,
    display_name: y.display_name,
  }));

  // Resolve year_sync_id and linked user email
  const [yearResult, userResult] = await Promise.all([
    person.year_id
      ? supabase.from("years").select("sync_id").eq("id", person.year_id).maybeSingle()
      : Promise.resolve({ data: null }),
    person.linked_user_id
      ? supabase
          .from("users")
          .select("email")
          .eq("id", person.linked_user_id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const canUpdate = await userCan(session, "update", "person");

  const initialData = {
    import_email: person.import_email,
    first_name: person.first_name,
    last_name: person.last_name,
    preferred_name: person.preferred_name,
    date_of_birth: person.date_of_birth,
    phone_number: person.phone_number,
    school_name: person.school_name,
    state: person.state,
    year_sync_id: yearResult.data?.sync_id ?? null,
    photo_url: person.photo_url,
    linked_user_email: userResult.data?.email ?? null,
  };

  const displayName =
    person.preferred_name ||
    [person.first_name, person.last_name].filter(Boolean).join(" ") ||
    userResult.data?.email ||
    syncId;

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/people" className="text-sm text-muted hover:text-fg transition-colors">
          ← People
        </Link>
        <h1 className="text-3xl font-bold text-fg mt-2">{displayName}</h1>
        <p className="text-muted mt-1">Edit person record.</p>
      </div>

      {canUpdate ? (
        <PersonForm mode="edit" syncId={syncId} initialData={initialData} years={years} />
      ) : (
        <p className="text-muted">You don&apos;t have permission to edit people.</p>
      )}
    </main>
  );
}
