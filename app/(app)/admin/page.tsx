import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/PageContainer";

async function getCounts() {
  const supabase = createServerClient();
  const [years, subjects, topics, worksheets, users, attempts] = await Promise.all([
    supabase.from("years").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("subjects").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("topics").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("worksheets").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("attempts").select("*", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const errors = [years, subjects, topics, worksheets, users, attempts]
    .map((r) => r.error?.message)
    .filter(Boolean);

  return {
    counts: {
      years: years.count ?? 0,
      subjects: subjects.count ?? 0,
      topics: topics.count ?? 0,
      worksheets: worksheets.count ?? 0,
      users: users.count ?? 0,
      attempts: attempts.count ?? 0,
    },
    errors,
  };
}

const SECTIONS = [
  { href: "/admin/years",    label: "Years",      description: "Manage year levels (Year 7–12)",     key: "years"      as const },
  { href: "/admin/subjects", label: "Subjects",   description: "Manage subjects per year level",      key: "subjects"   as const },
  { href: "/admin/topics",   label: "Topics",     description: "Create and publish topic pages",      key: "topics"     as const },
  { href: "/admin/worksheets", label: "Worksheets", description: "Add questions to topics",           key: "worksheets" as const },
  { href: "/admin/users",    label: "Users",      description: "Manage student and admin accounts",   key: "users"      as const },
];

const STATS = [
  { label: "Attempts submitted", key: "attempts" as const },
];

export default async function AdminDashboard() {
  const { counts, errors } = await getCounts();

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-1">Admin Dashboard</h1>
      <p className="text-muted mb-8">Manage content for At Ease Learning.</p>

      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <p className="font-semibold mb-1">Database errors:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Content management cards */}
      <ul className="grid gap-4 sm:grid-cols-2 mb-8">
        {SECTIONS.map(({ href, label, description, key }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex flex-col h-full rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-bold text-fg">{label}</span>
                <span className="text-2xl font-bold text-indigo-600">{counts[key]}</span>
              </div>
              <p className="text-sm text-muted">{description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {STATS.map(({ label, key }) => (
          <div key={key} className="rounded-xl border border-border bg-white shadow-sm p-6">
            <p className="text-sm text-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-fg">{counts[key]}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
