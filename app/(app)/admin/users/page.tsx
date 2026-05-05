"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const runtime = 'edge';

interface User {
  id: number;
  sync_id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  email_verified_at: string | null;
}

type Mode = "list" | "create" | "edit";

const BLANK = { email: "", display_name: "", password: "", is_admin: false };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/auth/me"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setCurrentUserId(me.id);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(BLANK);
    setEditing(null);
    setError("");
    setMode("create");
  }

  function openEdit(user: User) {
    setForm({ email: user.email, display_name: user.display_name ?? "", password: "", is_admin: user.is_admin });
    setEditing(user);
    setError("");
    setMode("edit");
  }

  function cancel() { setMode("list"); setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const isEdit = mode === "edit" && editing;
    const body: Record<string, unknown> = {
      email: form.email,
      display_name: form.display_name || null,
      is_admin: form.is_admin,
    };

    if (!isEdit) {
      body.password = form.password;
    } else if (form.password) {
      body.password = form.password;
    }

    const res = await fetch(
      isEdit ? `/api/admin/users/${editing.id}` : "/api/admin/users",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    await load();
    setMode("list");
    setSaving(false);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Remove ${user.email}? This will soft-delete their account.`)) return;
    setDeleting(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete user");
    } else {
      await load();
    }
    setDeleting(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <PageContainer as="main">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg">Users</h1>
          <p className="text-muted mt-1">Manage student and admin accounts.</p>
        </div>
        {mode === "list" && (
          <Button onClick={openCreate}>+ New User</Button>
        )}
      </div>

      {/* Form */}
      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-border bg-white shadow-sm max-w-md">
          <h2 className="text-lg font-bold text-fg mb-5">
            {mode === "create" ? "New User" : `Edit: ${editing?.email}`}
          </h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="student@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />

            <Input
              label="Name"
              placeholder="e.g. Alex Johnson"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              helper="Optional — shown in the app alongside the email"
            />

            <Input
              label={mode === "edit" ? "New password" : "Password"}
              type="password"
              placeholder={mode === "edit" ? "Leave blank to keep current" : "Min. 6 characters"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={mode === "create"}
              helper={mode === "edit" ? "Leave blank to keep the existing password" : undefined}
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-fg">Admin access</span>
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
      ) : users.length === 0 ? (
        <p className="text-muted">No users yet.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-fg">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-fg">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {user.display_name && (
                      <p className="font-medium text-fg">{user.display_name}</p>
                    )}
                    <p className={user.display_name ? "text-xs text-muted" : "font-medium text-fg"}>{user.email}</p>
                    {user.id === currentUserId && (
                      <p className="text-xs text-indigo-500">You</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user.is_admin
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {user.is_admin ? "Admin" : "Student"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUserId || deleting === user.id}
                        className="text-sm text-red-500 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.id === currentUserId ? "You cannot delete your own account" : undefined}
                      >
                        {deleting === user.id ? "…" : "Delete"}
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
