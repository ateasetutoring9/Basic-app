import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/PageContainer";

async function getCounts() {
  const supabase = createServerClient();
  const [years, subjects, topics, worksheets] = await Promise.all([
    supabase.from("years").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("subjects").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("topics").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_published", true),
    supabase.from("worksheets").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);
  return {
    years: years.count ?? 0,
    subjects: subjects.count ?? 0,
    topics: topics.count ?? 0,
    worksheets: worksheets.count ?? 0,
  };
}

const SECTIONS = [
  { href: "/admin/years", label: "Years", description: "Manage year levels (Year 7–12)", key: "years" as const },
  { href: "/admin/subjects", label: "Subjects", description: "Manage subjects per year level", key: "subjects" as const },
  { href: "/admin/topics", label: "Topics", description: "Create and publish topic pages", key: "topics" as const },
  { href: "/admin/worksheets", label: "Worksheets", description: "Add questions to topics", key: "worksheets" as const },
];

export default async function AdminDashboard() {
  const counts = await getCounts();

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-1">Admin Dashboard</h1>
      <p className="text-muted mb-8">Manage content for At Ease Learning.</p>

      <ul className="grid gap-4 sm:grid-cols-2">
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
    </PageContainer>
  );
}
