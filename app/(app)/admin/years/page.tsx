"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const runtime = 'edge';

interface Year {
  id: number;
  sync_id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

type Mode = "list" | "create" | "edit";

const BLANK = { name: "", display_name: "", is_active: true };

export default function YearsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Year | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/years");
    setYears(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(BLANK);
    setEditing(null);
    setError("");
    setMode("create");
  }

  function openEdit(year: Year) {
    setForm({ name: year.name, display_name: year.display_name, is_active: year.is_active });
    setEditing(year);
    setError("");
    setMode("edit");
  }

  function cancel() { setMode("list"); setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = mode === "edit" && editing;
    const res = await fetch(
      isEdit ? `/api/admin/years/${editing.id}` : "/api/admin/years",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    await load();
    setMode("list");
    setSaving(false);
  }

  async function toggleActive(year: Year) {
    await fetch(`/api/admin/years/${year.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !year.is_active }),
    });
    await load();
  }

  return (
    <PageContainer as="main">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg">Years</h1>
          <p className="text-muted mt-1">Manage year levels available on the platform.</p>
        </div>
        {mode === "list" && (
          <Button onClick={openCreate}>+ New Year</Button>
        )}
      </div>

      {/* Form */}
      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-border bg-white shadow-sm max-w-md">
          <h2 className="text-lg font-bold text-fg mb-5">
            {mode === "create" ? "New Year" : `Edit: ${editing?.display_name}`}
          </h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Machine name"
              placeholder="e.g. year-7"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              helper="Lowercase, hyphens only — used in URLs"
              required
            />
            <Input
              label="Display name"
              placeholder="e.g. Year 7"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              required
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
      ) : years.length === 0 ? (
        <p className="text-muted">No years yet. Add one above.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-fg">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Display name</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {years.map((year) => (
                <tr key={year.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-fg">{year.name}</td>
                  <td className="px-4 py-3 text-fg">{year.display_name}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(year)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        year.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {year.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/subjects?yearId=${year.id}`}
                        className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
                      >
                        Subjects →
                      </Link>
                      <button
                        onClick={() => openEdit(year)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
