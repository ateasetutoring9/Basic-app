import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { userCan } from "@/lib/auth/permissions";
import { getPeopleList, getYearsForFilter } from "./_lib/loaders";
import { PeopleFilters } from "./_components/PeopleFilters";

export const runtime = "edge";

interface Props {
  searchParams: Promise<{ search?: string; state?: string; "year-id"?: string }>;
}

export default async function PeoplePage({ searchParams }: Props) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) redirect("/login");

  const canRead = await userCan(session, "read", "person");
  if (!canRead) redirect("/admin");

  const canCreate = await userCan(session, "create", "person");

  const params = await searchParams;
  const filters = {
    search: params.search || undefined,
    state: params.state || undefined,
    yearId: params["year-id"] ? parseInt(params["year-id"], 10) : undefined,
  };

  const [people, years] = await Promise.all([getPeopleList(filters), getYearsForFilter()]);

  const hasFilters = !!(filters.search || filters.state || filters.yearId);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg">People</h1>
          <p className="text-muted mt-1">
            {people.length} active linked {people.length === 1 ? "person" : "people"}
          </p>
        </div>
        {canCreate && <Button href="/admin/people/new">+ New Person</Button>}
      </div>

      <Suspense fallback={<div className="h-10 mb-6" />}>
        <PeopleFilters years={years} />
      </Suspense>

      {people.length === 0 ? (
        <p className="text-muted">
          {hasFilters ? "No people match your filters." : "No people in the system yet."}
        </p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-fg">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Year</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">State</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Last updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {people.map((person) => (
                <tr key={person.sync_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-fg truncate">{person.display_name}</td>
                  <td className="px-4 py-3 text-muted truncate">{person.email}</td>
                  <td className="px-4 py-3 text-muted">{person.year_display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{person.state ?? "—"}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(person.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/people/${person.sync_id}`}
                      className="text-sm text-primary hover:underline whitespace-nowrap"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
