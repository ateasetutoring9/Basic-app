"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

export const runtime = 'edge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5)   return "just now";
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr ago`;
  return `${Math.floor(secs / 86400)} day${Math.floor(secs / 86400) === 1 ? "" : "s"} ago`;
}

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
    publishedAt: string | null;
    updatedAt: string;
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

interface ToastState {
  msg: string;
  link?: { href: string; label: string };
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

  async function toggleTopicPublish() {
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
              onClick={toggleTopicPublish}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                topic.isPublished
                  ? "bg-success-soft text-success hover:bg-success-soft"
                  : "bg-panel text-muted hover:bg-border"
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
        <MetadataSection topic={topic} onSaved={loadTopic} />
        <LectureSection topic={topic} />
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
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-panel transition-colors"
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
                className="w-full rounded-md border border-border-strong px-4 py-2.5 text-sm text-fg resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-card"
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
          {error && <p className="mt-4 text-sm text-error">{error}</p>}
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

function StatusPill({ isPublished, lastSavedAt }: { isPublished: boolean; lastSavedAt: Date | null }) {
  const timeStr = lastSavedAt ? relativeTime(lastSavedAt) : null;
  const suffix = isPublished
    ? timeStr ? `last updated ${timeStr}` : "live"
    : timeStr ? `last saved ${timeStr}` : "unsaved";

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPublished ? "bg-success" : "bg-[var(--text-tertiary)]"}`}
        aria-hidden="true"
      />
      <span className={`text-[0.6875rem] font-medium tracking-[0.06em] uppercase ${isPublished ? "text-success" : "text-muted"}`}>
        {isPublished ? "Published" : "Draft"} · {suffix}
      </span>
    </div>
  );
}

function UnpublishModal({ onCancel, onConfirm, submitting }: {
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-md border border-border bg-card p-6 w-full max-w-sm shadow-lg backdrop:bg-black/40"
    >
      <h3 className="text-subsection-title text-fg mb-2">Unpublish lecture?</h3>
      <p className="text-small text-muted mb-6 leading-relaxed">
        This lecture is currently visible to students. Unpublish it?
      </p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting} size="sm">
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-small font-medium bg-error text-[var(--accent-text-on)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "Unpublishing…" : "Unpublish"}
        </button>
      </div>
    </dialog>
  );
}

function LectureSection({ topic }: { topic: TopicDetail }) {
  const router = useRouter();

  const initMarkdown =
    topic.lecture?.format === "text"
      ? (topic.lecture.content.markdown as string) ?? ""
      : "";

  // ── Form state ───────────────────────────────────────────────────────────────
  const [title, setTitle]     = useState(topic.lecture?.title ?? topic.title);
  const [markdown, setMarkdown] = useState(initMarkdown);
  const [preview, setPreview] = useState(false);

  // ── Operation state ──────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors]   = useState<{ title?: string; content?: string }>({});

  // ── Publish state (managed locally — no parent reload needed for lecture ops) ─
  const [isPublished, setIsPublished] = useState(topic.lecture?.isPublished ?? false);
  const [lectureId, setLectureId]     = useState<number | null>(topic.lecture?.id ?? null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    topic.lecture?.updatedAt ? new Date(topic.lecture.updatedAt) : null
  );

  // ── Modal & toast ────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState<ToastState | null>(null);

  // ── Refs for auto-save interval (avoid stale closures) ───────────────────────
  const titleRef       = useRef(title);
  const markdownRef    = useRef(markdown);
  const isDirtyRef     = useRef(false);
  const isPublishedRef = useRef(isPublished);
  const lectureIdRef   = useRef(lectureId);

  // Keep refs in sync — update inline during render (valid React pattern for refs)
  titleRef.current       = title;
  markdownRef.current    = markdown;
  isDirtyRef.current     = isDirty;
  isPublishedRef.current = isPublished;
  lectureIdRef.current   = lectureId;

  // ── Sync form fields from prop when topic changes (e.g. metadata save reloads topic) ─
  useEffect(() => {
    if (!isDirtyRef.current) {
      setTitle(topic.lecture?.title ?? topic.title);
      setMarkdown(
        topic.lecture?.format === "text"
          ? (topic.lecture.content.markdown as string) ?? ""
          : ""
      );
      if (topic.lecture?.updatedAt) setLastSavedAt(new Date(topic.lecture.updatedAt));
    }
    // Always sync publish state and ID from DB (safe — these aren't typed by the user)
    setIsPublished(topic.lecture?.isPublished ?? false);
    setLectureId(topic.lecture?.id ?? null);
  }, [topic]);

  // ── Warn on tab close when dirty ─────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => { if (isDirtyRef.current) e.preventDefault(); };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, []);

  // ── Auto-save: every 30s, draft only, when dirty ─────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isDirtyRef.current || isPublishedRef.current) return;
      const res = await fetch("/api/admin/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          title: titleRef.current || topic.title,
          format: "text",
          content: markdownRef.current,
          is_published: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id && !lectureIdRef.current) setLectureId(data.id);
        isDirtyRef.current = false;
        setIsDirty(false);
        setLastSavedAt(new Date());
      }
    }, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, topic.title]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function markDirty() { setIsDirty(true); }

  function clearErrors() { setErrors({}); }

  function validate(): boolean {
    const errs: { title?: string; content?: string } = {};
    if (!title.trim()) errs.title = "Title is required before publishing.";
    if (!markdown.trim()) errs.content = "Content cannot be empty before publishing.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function callSave(publishState: boolean): Promise<{ ok: boolean; id?: number }> {
    setSaving(true);
    const res = await fetch("/api/admin/lectures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topic.id,
        title: title.trim() || topic.title,
        format: "text",
        content: markdown,
        is_published: publishState,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setErrors({ content: data.error ?? "Failed to save." });
      return { ok: false };
    }
    const data = await res.json();
    setIsDirty(false);
    setLastSavedAt(new Date());
    return { ok: true, id: data.id };
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function handleSaveDraft() {
    const result = await callSave(false);
    if (!result.ok) return;
    if (result.id) setLectureId(result.id);
    setIsPublished(false);
    setToast({ msg: "Draft saved. Students can't see this yet." });
  }

  async function handleSaveAndPublish() {
    if (!validate()) return;
    const result = await callSave(true);
    if (!result.ok) return;
    if (result.id) setLectureId(result.id);
    setIsPublished(true);
    setToast({
      msg: "Published.",
      link: { href: `/learn/${topic.syncId}`, label: "View as student →" },
    });
  }

  async function handleSaveChanges() {
    if (!validate()) return;
    const result = await callSave(true);
    if (!result.ok) return;
    setIsPublished(true);
    setToast({ msg: "Saved. Changes are live." });
  }

  async function handleUnpublish() {
    setShowModal(false);
    if (!lectureId) return;
    setSaving(true);
    const res = await fetch("/api/admin/lectures", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lectureId, is_published: false }),
    });
    setSaving(false);
    if (res.ok) {
      setIsPublished(false);
      setLastSavedAt(new Date());
      setToast({ msg: "Unpublished. Students can no longer see this." });
    }
  }

  async function handleSaveAndFinish() {
    if (isPublished && !validate()) return;
    const result = await callSave(isPublished);
    if (!result.ok) return;
    if (result.id) setLectureId(result.id);
    router.push("/admin/topics");
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-fg">Lecture</h2>
          <p className="text-xs text-muted mt-0.5">Markdown text format</p>
        </div>
        <button
          onClick={() => setPreview((p) => !p)}
          className="text-sm text-muted hover:text-fg transition-colors"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Toast — full-width banner below header */}
      {toast && (
        <Toast message={toast.msg} link={toast.link} onDismiss={() => setToast(null)} />
      )}

      {/* Body */}
      <div className="p-6">
        {/* Status pill */}
        <div className="mb-5">
          <StatusPill isPublished={isPublished} lastSavedAt={lastSavedAt} />
        </div>

        {/* Title field */}
        <div className="mb-4 max-w-lg">
          <Input
            label="Lecture title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); clearErrors(); }}
            placeholder={topic.title}
            error={errors.title}
          />
        </div>

        {/* Editor / preview */}
        {preview ? (
          <div className="prose prose-sm max-w-none min-h-[300px] p-4 rounded-md bg-panel border border-border">
            {markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            ) : (
              <p className="text-muted italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            value={markdown}
            onChange={(e) => { setMarkdown(e.target.value); markDirty(); clearErrors(); }}
            rows={20}
            className="w-full rounded-md border border-border-strong px-4 py-3 text-sm font-mono text-fg resize-y focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-card min-h-[300px]"
            placeholder={"# Introduction\n\nWrite your lecture content here using Markdown…\n\n## Section\n\nMore content…"}
            spellCheck={false}
          />
        )}

        {errors.content && (
          <p className="mt-1 text-small text-error">{errors.content}</p>
        )}

        <p className="text-xs text-muted mt-2">
          Supports GitHub Flavoured Markdown — headings, bold, italic, lists, tables, code blocks.
          {!isPublished && isDirty && (
            <span className="ml-1 text-[var(--text-tertiary)]">Auto-saves every 30 s.</span>
          )}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {isPublished ? (
            <>
              <Button variant="secondary" onClick={handleSaveChanges} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button onClick={handleSaveAndFinish} disabled={saving}>
                {saving ? "Saving…" : "Save and finish"}
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(true)} disabled={saving}>
                Unpublish
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleSaveAndPublish} disabled={saving}>
                {saving ? "Saving…" : "Save and publish"}
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button onClick={handleSaveAndFinish} disabled={saving}>
                {saving ? "Saving…" : "Save and finish"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Unpublish confirmation modal */}
      {showModal && (
        <UnpublishModal
          onCancel={() => setShowModal(false)}
          onConfirm={handleUnpublish}
          submitting={saving}
        />
      )}
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
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                <span className={ws.isPublished ? "text-success" : "text-muted"}>
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
