"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicDetail {
  id: number;
  syncId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  subject: { id: number; name: string; year: { displayName: string } | null } | null;
  lecture: {
    id: number;
    format: string;
    title: string;
    content: Record<string, unknown>;
    isPublished: boolean;
  } | null;
  worksheet: {
    id: number;
    syncId: string;
    title: string;
    questions: unknown[];
    difficulty: number;
    isPublished: boolean;
  } | null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TopicDetailPage() {
  const { syncId } = useParams<{ syncId: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function loadTopic() {
    const res = await fetch(`/api/admin/topics/sync/${syncId}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    setTopic(await res.json());
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTopic(); }, [syncId]);

  async function togglePublish() {
    if (!topic) return;
    await fetch(`/api/admin/topics/${topic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !topic.isPublished }),
    });
    await loadTopic();
  }

  if (loading) return <PageContainer as="main"><p className="text-muted animate-pulse">Loading…</p></PageContainer>;
  if (notFound || !topic) return (
    <PageContainer as="main">
      <p className="text-muted">Topic not found.</p>
      <Link href="/admin/topics" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to Topics</Link>
    </PageContainer>
  );

  return (
    <PageContainer as="main">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted mb-3">
          <Link href="/admin/topics" className="hover:text-fg transition-colors">Topics</Link>
          <span>/</span>
          <span className="text-fg font-medium truncate">{topic.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-fg">{topic.title}</h1>
            {topic.subject && (
              <p className="text-muted mt-1">
                {topic.subject.year?.displayName} — {topic.subject.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={togglePublish}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                topic.isPublished
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {topic.isPublished ? "Published" : "Draft"}
            </button>
            <Link
              href={`/learn/${topic.syncId}`}
              target="_blank"
              className="text-sm text-muted hover:text-fg transition-colors"
            >
              Preview ↗
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Metadata section */}
        <MetadataSection topic={topic} onSaved={loadTopic} />

        {/* Lecture section */}
        <LectureSection topic={topic} onSaved={loadTopic} />

        {/* Worksheet section */}
        <WorksheetSection topic={topic} router={router} />
      </div>
    </PageContainer>
  );
}

// ─── Metadata section ─────────────────────────────────────────────────────────

function MetadataSection({ topic, onSaved }: { topic: TopicDetail; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: topic.title,
    description: topic.description ?? "",
    thumbnail_url: topic.thumbnailUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ title: topic.title, description: topic.description ?? "", thumbnail_url: topic.thumbnailUrl ?? "" });
  }, [topic]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/topics/${topic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    await onSaved();
    setOpen(false);
    setSaving(false);
  }

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-fg">Metadata</span>
        <span className="text-muted text-sm">{open ? "▲ Collapse" : "▼ Edit"}</span>
      </button>
      {open && (
        <form onSubmit={handleSave} className="px-6 pb-6 border-t border-border pt-5">
          <div className="flex flex-col gap-4 max-w-lg">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-fg">Description <span className="font-normal text-muted">(optional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
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
          <div className="flex gap-3 mt-5">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save metadata"}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── Lecture section ──────────────────────────────────────────────────────────

function LectureSection({ topic, onSaved }: { topic: TopicDetail; onSaved: () => void }) {
  const existingMarkdown =
    topic.lecture?.format === "text"
      ? (topic.lecture.content.markdown as string) ?? ""
      : "";

  const [title, setTitle] = useState(topic.lecture?.title ?? topic.title);
  const [markdown, setMarkdown] = useState(existingMarkdown);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const isDirty = useRef(false);

  useEffect(() => {
    setTitle(topic.lecture?.title ?? topic.title);
    setMarkdown(
      topic.lecture?.format === "text"
        ? (topic.lecture.content.markdown as string) ?? ""
        : ""
    );
  }, [topic]);

  // Warn on browser tab close / refresh when unsaved changes exist
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty.current) { e.preventDefault(); }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function markDirty() { isDirty.current = true; setSaved(false); }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/lectures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topic.id,
        title: title || topic.title,
        format: "text",
        content: markdown,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
    isDirty.current = false;
    setSaved(true);
    setSaving(false);
    await onSaved();
  }

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-fg">Lecture</h2>
          <p className="text-xs text-muted mt-0.5">Markdown text format</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview((p) => !p)}
            className="text-sm text-muted hover:text-fg transition-colors"
          >
            {preview ? "Edit" : "Preview"}
          </button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save lecture"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 max-w-lg">
          <Input
            label="Lecture title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder={topic.title}
          />
        </div>

        {preview ? (
          <div className="prose prose-sm max-w-none min-h-[300px] p-4 rounded-lg bg-gray-50 border border-border">
            {markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            ) : (
              <p className="text-muted italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            value={markdown}
            onChange={(e) => { setMarkdown(e.target.value); markDirty(); }}
            rows={20}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm font-mono text-fg resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[300px]"
            placeholder={"# Introduction\n\nWrite your lecture content here using Markdown…\n\n## Section\n\nMore content…"}
            spellCheck={false}
          />
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="text-xs text-muted mt-2">Supports GitHub Flavoured Markdown — headings, bold, italic, lists, tables, code blocks.</p>
      </div>
    </section>
  );
}

// ─── Worksheet section ────────────────────────────────────────────────────────

function WorksheetSection({
  topic,
  router,
}: {
  topic: TopicDetail;
  router: ReturnType<typeof useRouter>;
}) {
  const ws = topic.worksheet;

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-fg">Worksheet</h2>
          {ws && (
            <p className="text-xs text-muted mt-0.5">
              {ws.questions.length} question{ws.questions.length !== 1 ? "s" : ""} · difficulty {ws.difficulty}/5
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push(`/admin/topics/${topic.syncId}/worksheet`)}
          size="sm"
          variant={ws ? "secondary" : "primary"}
        >
          {ws ? "Edit worksheet" : "Add worksheet"}
        </Button>
      </div>

      <div className="px-6 py-5">
        {ws ? (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-fg">{ws.title}</p>
              <p className="text-sm text-muted mt-0.5">
                {ws.questions.length} question{ws.questions.length !== 1 ? "s" : ""}
                {" · "}
                <span className={ws.isPublished ? "text-green-600" : "text-gray-500"}>
                  {ws.isPublished ? "Published" : "Draft"}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No worksheet yet. Click &ldquo;Add worksheet&rdquo; to create one.</p>
        )}
      </div>
    </section>
  );
}
