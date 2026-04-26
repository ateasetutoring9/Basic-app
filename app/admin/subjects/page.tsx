"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Year { id: number; name: string; display_name: string; }
interface Subject {
  id: number;
  sync_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  year_id: number;
  years: Year | null;
}

type Mode = "list" | "create" | "edit";

const BLANK = { year_id: 0, name: "", description: "", display_order: 0, is_active: true };

function SubjectsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Active year filter — driven by URL param
  const yearIdParam = searchParams.get("yearId");
  const [filterYearId, setFilterYearId] = useState<number | null>(
    yearIdParam ? parseInt(yearIdParam, 10) : null
  );

  async function load() {
    setLoading(true);
    const [sRes, yRes, tRes] = await Promise.all([
      fetch("/api/admin/subjects"),
      fetch("/api/admin/years"),
      fetch("/api/admin/topics"),
    ]);
    const rawSubjects: Subject[] = await sRes.json();
    const rawYears: Year[] = await yRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTopics: any[] = await tRes.json();

    setSubjects(rawSubjects);
    setYears(rawYears);

    // Compute topic count per subject_id from the topics loader response
    const counts: Record<number, number> = {};
    for (const t of rawTopics) {
      const sid = t.subject?.id ?? t.subject_id;
      if (sid) counts[sid] = (counts[sid] ?? 0) + 1;
    }
    setTopicCounts(counts);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Sync filter state when URL param changes
  useEffect(() => {
    setFilterYearId(yearIdParam ? parseInt(yearIdParam, 10) : null);
  }, [yearIdParam]);

  function setYearFilter(id: number | null) {
    setFilterYearId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("yearId", String(id));
    else params.delete("yearId");
    router.replace(`/admin/subjects?${params.toString()}`);
  }

  const visibleSubjects = filterYearId
    ? subjects.filter((s) => s.year_id === filterYearId)
    : subjects;

  const byYear = years
    .map((y) => ({ year: y, subjects: visibleSubjects.filter((s) => s.year_id === y.id) }))
    .filter((g) => g.subjects.length > 0 || !filterYearId);

  function openCreate() {
    setForm({ ...BLANK, year_id: filterYearId ?? (years[0]?.id ?? 0) });
    setEditing(null);
    setError("");
    setMode("create");
  }

  function openEdit(s: Subject) {
    setForm({
      year_id: s.year_id,
      name: s.name,
      description: s.description ?? "",
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setEditing(s);
    setError("");
    setMode("edit");
  }

  function cancel() { setMode("list"); setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.year_id) { setError("Please select a year"); return; }
    setSaving(true);
    setError("");
    const isEdit = mode === "edit" && editing;
    const res = await fetch(
      isEdit ? `/api/admin/subjects/${editing.id}` : "/api/admin/subjects",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      }
    );
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    await load();
    setMode("list");
    setSaving(false);
  }

  async function toggleActive(s: Subject) {
    await fetch(`/api/admin/subjects/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    await load();
  }

  return (
    <PageContainer as="main">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg">Subjects</h1>
          <p className="text-muted mt-1">Manage subjects within each year level.</p>
        </div>
        {mode === "list" && years.length > 0 && (
          <Button onClick={openCreate}>+ New Subject</Button>
        )}
      </div>

      {years.length === 0 && !loading && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
          You need at least one year before adding subjects.{" "}
          <Link href="/admin/years" className="font-semibold underline">Add a year →</Link>
        </div>
      )}

      {/* Year filter tabs */}
      {years.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setYearFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterYearId === null
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => setYearFilter(y.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterYearId === y.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {y.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-border bg-white shadow-sm max-w-md">
          <h2 className="text-lg font-bold text-fg mb-5">
            {mode === "create" ? "New Subject" : `Edit: ${editing?.name}`}
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-fg">Year level</label>
              <select
                value={form.year_id}
                onChange={(e) => setForm((f) => ({ ...f, year_id: parseInt(e.target.value) }))}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px]"
                required
              >
                <option value={0} disabled>Select a year…</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.display_name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Subject name"
              placeholder="e.g. Mathematics"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-fg">Description <span className="font-normal text-muted">(optional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Short description shown on the browse page"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-fg resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <Input
              label="Display order"
              type="number"
              min="0"
              value={String(form.display_order)}
              onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
              helper="Lower numbers appear first within the year"
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-fg">Active (visible to students)</span>
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-muted animate-pulse">Loading…</p>
      ) : visibleSubjects.length === 0 ? (
        <p className="text-muted">No subjects{filterYearId ? " for this year" : ""} yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {byYear.map(({ year, subjects: ys }) => ys.length > 0 && (
            <section key={year.id}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{year.display_name}</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-fg">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-fg">Order</th>
                      <th className="text-left px-4 py-3 font-semibold text-fg">Topics</th>
                      <th className="text-left px-4 py-3 font-semibold text-fg">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {ys.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-fg">{s.name}</p>
                          {s.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{s.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-muted">{s.display_order}</td>
                        <td className="px-4 py-3 text-muted">{topicCounts[s.id] ?? 0}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(s)}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                              s.is_active
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {s.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-4">
                            <Link
                              href={`/admin/topics?subjectId=${s.id}`}
                              className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
                            >
                              Topics →
                            </Link>
                            <button onClick={() => openEdit(s)} className="text-sm text-primary hover:underline">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted animate-pulse">Loading…</div>}>
      <SubjectsInner />
    </Suspense>
  );
}
