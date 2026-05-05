"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const runtime = 'edge';

interface Year { id: number; display_name: string; }
interface Subject { id: number; name: string; year_id: number; years: Year | null; }
interface Topic {
  id: number;
  sync_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  subject_id: number;
}

const BLANK = { subject_id: 0, title: "", description: "", thumbnail_url: "" };

function TopicsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const subjectIdParam = searchParams.get("subjectId");
  const [filterSubjectId, setFilterSubjectId] = useState<number | null>(
    subjectIdParam ? parseInt(subjectIdParam, 10) : null
  );

  async function load() {
    setLoading(true);
    const [tRes, sRes] = await Promise.all([
      fetch("/api/admin/topics"),
      fetch("/api/admin/subjects"),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTopics: any[] = await tRes.json();
    const rawSubjects: Subject[] = await sRes.json();

    const mapped: Topic[] = rawTopics.map((t) => ({
      id: t.id,
      sync_id: t.syncId,
      title: t.title,
      description: t.description,
      thumbnail_url: t.thumbnailUrl,
      is_published: t.isPublished,
      subject_id: t.subject?.id ?? 0,
    }));

    setTopics(mapped);
    setSubjects(rawSubjects);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFilterSubjectId(subjectIdParam ? parseInt(subjectIdParam, 10) : null);
  }, [subjectIdParam]);

  function setSubjectFilter(id: number | null) {
    setFilterSubjectId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("subjectId", String(id));
    else params.delete("subjectId");
    router.replace(`/admin/topics?${params.toString()}`);
  }

  function openCreate() {
    setForm({ ...BLANK, subject_id: filterSubjectId ?? (subjects[0]?.id ?? 0) });
    setError("");
    setShowForm(true);
  }

  function cancel() { setShowForm(false); setError(""); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject_id) { setError("Please select a subject"); return; }
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: form.subject_id,
        title: form.title,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        is_published: false,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    // Redirect to the topic detail page for content authoring
    router.push(`/admin/topics/${data.sync_id}`);
  }

  async function togglePublished(t: Topic) {
    await fetch(`/api/admin/topics/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !t.is_published }),
    });
    await load();
  }

  async function handleDelete(t: Topic) {
    if (!confirm(`Delete "${t.title}"? This cannot be undone.`)) return;
    setDeleting(t.id);
    await fetch(`/api/admin/topics/${t.id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Build subject filter options grouped by year
  const subjectsByYear: { yearDisplay: string; subs: Subject[] }[] = [];
  const yearSeen = new Set<number>();
  for (const s of subjects) {
    const yid = s.year_id;
    if (!yearSeen.has(yid)) {
      yearSeen.add(yid);
      subjectsByYear.push({ yearDisplay: s.years?.display_name ?? "Unknown", subs: [] });
    }
    subjectsByYear[subjectsByYear.length - 1].subs.push(s);
  }

  const visibleTopics = filterSubjectId
    ? topics.filter((t) => t.subject_id === filterSubjectId)
    : topics;

  // Group visible topics by subject for display
  const groupedBySubject = new Map<number, Topic[]>();
  for (const t of visibleTopics) {
    if (!groupedBySubject.has(t.subject_id)) groupedBySubject.set(t.subject_id, []);
    groupedBySubject.get(t.subject_id)!.push(t);
  }

  return (
    <PageContainer as="main">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg">Topics</h1>
          <p className="text-muted mt-1">Create topics then add lecture and worksheet content.</p>
        </div>
        {!showForm && subjects.length > 0 && (
          <Button onClick={openCreate}>+ New Topic</Button>
        )}
      </div>

      {subjects.length === 0 && !loading && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
          You need at least one subject before adding topics.{" "}
          <Link href="/admin/subjects" className="font-semibold underline">Add a subject →</Link>
        </div>
      )}

      {/* Subject filter tabs */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSubjectFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterSubjectId === null
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            All subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterSubjectId === s.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {s.years?.display_name} — {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Create form — metadata only */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-xl border border-border bg-white shadow-sm max-w-lg">
          <h2 className="text-lg font-bold text-fg mb-5">New Topic</h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-fg">Subject</label>
              <select
                value={form.subject_id}
                onChange={(e) => setForm((f) => ({ ...f, subject_id: parseInt(e.target.value) }))}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px]"
                required
              >
                <option value={0} disabled>Select a subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.years?.display_name} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Title"
              placeholder="e.g. Introduction to Algebra"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-fg">
                Description <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Short description shown on browse and topic pages"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-fg resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <Input
              label="Thumbnail URL"
              placeholder="https://…"
              value={form.thumbnail_url}
              onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
              helper="Optional preview image"
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create & Edit Content"}</Button>
            <Button type="button" variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-muted animate-pulse">Loading…</p>
      ) : visibleTopics.length === 0 ? (
        <p className="text-muted">No topics{filterSubjectId ? " for this subject" : ""} yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(groupedBySubject.entries()).map(([subjectId, ts]) => {
            const subject = subjectMap.get(subjectId);
            return (
              <section key={subjectId}>
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
                    {subject?.years?.display_name} — {subject?.name ?? "Unknown subject"}
                  </h2>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-fg">Title</th>
                        <th className="text-left px-4 py-3 font-semibold text-fg">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {ts.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-fg">{t.title}</p>
                            {t.description && (
                              <p className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePublished(t)}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                t.is_published
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {t.is_published ? "Published" : "Draft"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-4">
                              <Link
                                href={`/admin/topics/${t.sync_id}`}
                                className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
                              >
                                Edit content →
                              </Link>
                              <button
                                onClick={() => handleDelete(t)}
                                disabled={deleting === t.id}
                                className="text-sm text-red-500 hover:underline disabled:opacity-50"
                              >
                                {deleting === t.id ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted animate-pulse">Loading…</div>}>
      <TopicsInner />
    </Suspense>
  );
}
