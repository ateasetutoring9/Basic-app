"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageContainer } from "@/components/ui/PageContainer";
import MarkdownPreview from "@/components/lecture/MarkdownPreview";
import SlidesViewer from "@/components/lecture/SlidesViewer";
import YouTubeFacade from "@/components/lecture/YouTubeFacade";
import { WorksheetClient } from "@/components/WorksheetClient";
import {
  QuestionEditor,
  blankQuestion,
  editorQuestionsToPayload,
} from "@/components/admin/QuestionEditor";
import type { EditorQuestion } from "@/components/admin/QuestionEditor";
import { WorksheetFileSchema } from "@/lib/content/schemas";
import type { Subject, YearLevel, Worksheet } from "@/lib/content/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "topic" | "lecture" | "worksheet";
type LectureFormat = "text" | "video" | "slides";

interface TopicState {
  subject: string;
  year: string;
  slug: string;
  title: string;
  description: string;
  orderIndex: string;
}

interface LectureState {
  format: LectureFormat;
  textContent: string;
  youtubeId: string;
  slidesHtml: string;
}

interface WorksheetState {
  title: string;
  questions: EditorQuestion[];
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const topicSchema = z.object({
  subject: z.string().min(1, "Required"),
  year: z.coerce
    .number()
    .int()
    .min(7, "Must be 7–12")
    .max(12, "Must be 7–12"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  orderIndex: z.coerce
    .number()
    .int("Must be a whole number")
    .nonnegative("Must be 0 or greater"),
});

const lectureSchema = z.discriminatedUnion("format", [
  z.object({ format: z.literal("text"), textContent: z.string().min(1, "Content is required") }),
  z.object({ format: z.literal("video"), youtubeId: z.string().min(1, "YouTube ID is required") }),
  z.object({ format: z.literal("slides"), slidesHtml: z.string().min(1, "HTML content is required") }),
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenZodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function validateTopic(s: TopicState): Record<string, string> {
  const r = topicSchema.safeParse(s);
  return r.success ? {} : flattenZodErrors(r.error);
}

function validateLecture(s: LectureState): Record<string, string> {
  const r = lectureSchema.safeParse(s);
  return r.success ? {} : flattenZodErrors(r.error);
}

function validateWorksheet(s: WorksheetState): Record<string, string> {
  const payload = {
    title: s.title,
    questions: editorQuestionsToPayload(s.questions.filter((q) => q.text.trim())),
  };
  const r = WorksheetFileSchema.safeParse(payload);
  return r.success ? {} : flattenZodErrors(r.error);
}

function lectureHasContent(s: LectureState): boolean {
  return !!(s.textContent.trim() || s.youtubeId.trim() || s.slidesHtml.trim());
}

function worksheetHasContent(s: WorksheetState): boolean {
  return !!(s.title.trim() || s.questions.some((q) => q.text.trim()));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditorClient() {
  const [tab, setTab] = useState<Tab>("topic");
  const [preview, setPreview] = useState<Record<Tab, boolean>>({
    topic: false,
    lecture: false,
    worksheet: false,
  });

  const [topic, setTopic] = useState<TopicState>({
    subject: "math",
    year: "7",
    slug: "",
    title: "",
    description: "",
    orderIndex: "0",
  });
  const [lecture, setLecture] = useState<LectureState>({
    format: "text",
    textContent: "",
    youtubeId: "",
    slidesHtml: "",
  });
  const [worksheet, setWorksheet] = useState<WorksheetState>({
    title: "",
    questions: [blankQuestion()],
  });

  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ─── Derived validation ───────────────────────────────────────────────────

  const topicErrors = validateTopic(topic);
  const lectureErrors = lectureHasContent(lecture) ? validateLecture(lecture) : {};
  const worksheetErrors = worksheetHasContent(worksheet) ? validateWorksheet(worksheet) : {};
  const isValid =
    Object.keys(topicErrors).length === 0 &&
    Object.keys(lectureErrors).length === 0 &&
    Object.keys(worksheetErrors).length === 0;

  function visibleErrors(prefix: string, all: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      if (saveAttempted || touched.has(`${prefix}.${k}`)) out[k] = v;
    }
    return out;
  }

  const topicVisible = visibleErrors("topic", topicErrors);
  const lectureVisible = visibleErrors("lecture", lectureErrors);
  const worksheetVisible = visibleErrors("worksheet", worksheetErrors);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function touch(field: string) {
    setTouched((prev) => new Set(prev).add(field));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    setSaveAttempted(true);
    if (!isValid) return;

    const payload: Record<string, unknown> = {
      _path: `content/${topic.subject}/year-${topic.year}/${topic.slug}/`,
      meta: {
        title: topic.title,
        description: topic.description,
        orderIndex: parseInt(topic.orderIndex),
      },
    };

    if (lectureHasContent(lecture)) {
      if (lecture.format === "text") payload.lecture = { format: "text", content: lecture.textContent };
      if (lecture.format === "video") payload.lecture = { format: "video", youtubeId: lecture.youtubeId };
      if (lecture.format === "slides") payload.lecture = { format: "slides", content: lecture.slidesHtml };
    }

    if (worksheetHasContent(worksheet)) {
      payload.worksheet = {
        title: worksheet.title,
        questions: editorQuestionsToPayload(worksheet.questions),
      };
    }

    console.log("[Content Editor] Saved payload:", JSON.stringify(payload, null, 2));
    showToast("Saved (stub)");
  }

  const handleCopyJson = useCallback(async () => {
    let json: unknown;

    if (tab === "topic") {
      json = {
        title: topic.title,
        description: topic.description,
        orderIndex: parseInt(topic.orderIndex) || 0,
      };
    } else if (tab === "lecture") {
      if (lecture.format === "text") json = { format: "text", content: lecture.textContent };
      else if (lecture.format === "video") json = { format: "video", youtubeId: lecture.youtubeId };
      else json = { format: "slides", content: lecture.slidesHtml };
    } else {
      json = {
        title: worksheet.title,
        questions: editorQuestionsToPayload(worksheet.questions),
      };
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Copy failed — check browser permissions");
    }
  }, [tab, topic, lecture, worksheet]);

  function togglePreview() {
    setPreview((prev) => ({ ...prev, [tab]: !prev[tab] }));
  }

  const isPreview = preview[tab];

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            Dev tool
          </span>
          <h1 className="text-2xl font-bold text-fg">Content Editor</h1>
          <p className="text-sm text-muted mt-0.5">
            Fill in the tabs below, then Copy JSON to paste into{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
              content/
            </code>{" "}
            files.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleCopyJson}
            className="text-sm"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveAttempted && !isValid}
            className="text-sm"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {(["topic", "lecture", "worksheet"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors min-h-[44px] border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Edit / Preview toggle */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => !isPreview || togglePreview()}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors min-h-[36px] ${
            !isPreview ? "bg-white shadow-sm text-fg" : "text-muted hover:text-fg"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => isPreview || togglePreview()}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors min-h-[36px] ${
            isPreview ? "bg-white shadow-sm text-fg" : "text-muted hover:text-fg"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Tab content */}
      {tab === "topic" && (
        <TopicTab
          state={topic}
          onChange={setTopic}
          onBlur={(f) => touch(`topic.${f}`)}
          errors={topicVisible}
          preview={isPreview}
        />
      )}
      {tab === "lecture" && (
        <LectureTab
          state={lecture}
          onChange={setLecture}
          onBlur={(f) => touch(`lecture.${f}`)}
          errors={lectureVisible}
          preview={isPreview}
          topicTitle={topic.title || "Untitled Topic"}
        />
      )}
      {tab === "worksheet" && (
        <WorksheetTab
          state={worksheet}
          onChange={setWorksheet}
          onBlur={(f) => touch(`worksheet.${f}`)}
          errors={worksheetVisible}
          preview={isPreview}
          topicState={topic}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg"
        >
          {toast}
        </div>
      )}
    </PageContainer>
  );
}

// ─── Topic tab ────────────────────────────────────────────────────────────────

function TopicTab({
  state,
  onChange,
  onBlur,
  errors,
  preview,
}: {
  state: TopicState;
  onChange: (s: TopicState) => void;
  onBlur: (field: string) => void;
  errors: Record<string, string>;
  preview: boolean;
}) {
  function set(patch: Partial<TopicState>) {
    onChange({ ...state, ...patch });
  }

  if (preview) {
    return (
      <Card className="max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {state.subject || "subject"} · Year {state.year || "?"}
          </span>
        </div>
        <h2 className="text-lg font-bold text-fg leading-snug mb-1">
          {state.title || <span className="text-muted italic">No title</span>}
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          {state.description || <span className="italic">No description</span>}
        </p>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted flex gap-4">
          <span>slug: <code className="font-mono">{state.slug || "—"}</code></span>
          <span>order: {state.orderIndex || "0"}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg">Subject</label>
          <select
            value={state.subject}
            onChange={(e) => set({ subject: e.target.value })}
            onBlur={() => onBlur("subject")}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[44px]"
          >
            <option value="math">Math</option>
          </select>
          {errors.subject && <p role="alert" className="text-sm text-error">{errors.subject}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg">Year level</label>
          <select
            value={state.year}
            onChange={(e) => set({ year: e.target.value })}
            onBlur={() => onBlur("year")}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[44px]"
          >
            {[7, 8, 9, 10, 11, 12].map((y) => (
              <option key={y} value={String(y)}>Year {y}</option>
            ))}
          </select>
          {errors.year && <p role="alert" className="text-sm text-error">{errors.year}</p>}
        </div>
      </div>

      <Input
        label="Slug"
        value={state.slug}
        onChange={(e) => set({ slug: e.target.value })}
        onBlur={() => onBlur("slug")}
        error={errors.slug}
        placeholder="e.g. intro-to-algebra"
        helper="Used in the URL and as the folder name under content/"
      />

      <Input
        label="Title"
        value={state.title}
        onChange={(e) => set({ title: e.target.value })}
        onBlur={() => onBlur("title")}
        error={errors.title}
        placeholder="e.g. Introduction to Algebra"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-fg">Description</label>
        <textarea
          value={state.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => onBlur("description")}
          rows={3}
          placeholder="A short description shown on the browse page."
          className={`w-full rounded-lg border px-4 py-2.5 text-base text-fg resize-none focus:outline-none focus:ring-2 ${
            errors.description
              ? "border-error focus:ring-error/40"
              : "border-border focus:ring-primary/40 focus:border-primary"
          }`}
        />
        {errors.description && (
          <p role="alert" className="text-sm text-error">{errors.description}</p>
        )}
      </div>

      <Input
        label="Order index"
        type="number"
        min="0"
        value={state.orderIndex}
        onChange={(e) => set({ orderIndex: e.target.value })}
        onBlur={() => onBlur("orderIndex")}
        error={errors.orderIndex}
        helper="Controls sort order within the year — lower numbers appear first"
      />
    </div>
  );
}

// ─── Lecture tab ──────────────────────────────────────────────────────────────

function LectureTab({
  state,
  onChange,
  onBlur,
  errors,
  preview,
  topicTitle,
}: {
  state: LectureState;
  onChange: (s: LectureState) => void;
  onBlur: (field: string) => void;
  errors: Record<string, string>;
  preview: boolean;
  topicTitle: string;
}) {
  function set(patch: Partial<LectureState>) {
    onChange({ ...state, ...patch });
  }

  if (preview) {
    if (state.format === "text") {
      return state.textContent.trim() ? (
        <div className="prose-wrapper">
          <MarkdownPreview content={state.textContent} />
        </div>
      ) : (
        <EmptyPreview message="Add some markdown content to see a preview." />
      );
    }
    if (state.format === "video") {
      return state.youtubeId.trim() ? (
        <YouTubeFacade youtubeId={state.youtubeId} title={topicTitle} />
      ) : (
        <EmptyPreview message="Enter a YouTube ID to see a preview." />
      );
    }
    // slides
    return state.slidesHtml.trim() ? (
      <SlidesViewer html={state.slidesHtml} title={topicTitle} />
    ) : (
      <EmptyPreview message="Add some HTML slide content to see a preview." />
    );
  }

  return (
    <div className="space-y-5">
      {/* Format selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-fg">Format</label>
        <div className="flex gap-3">
          {(["text", "video", "slides"] as LectureFormat[]).map((f) => (
            <label
              key={f}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors min-h-[44px] text-sm font-medium ${
                state.format === f
                  ? "border-primary bg-indigo-50 text-primary"
                  : "border-border text-fg hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="lecture-format"
                value={f}
                checked={state.format === f}
                onChange={() => set({ format: f })}
                className="sr-only"
              />
              {f === "text" ? "Markdown" : f === "video" ? "YouTube" : "Slides (HTML)"}
            </label>
          ))}
        </div>
      </div>

      {/* Format-specific fields */}
      {state.format === "text" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg">Markdown content</label>
          <textarea
            value={state.textContent}
            onChange={(e) => set({ textContent: e.target.value })}
            onBlur={() => onBlur("textContent")}
            rows={16}
            placeholder={"# Heading\n\nWrite your lesson content here using Markdown…"}
            className={`w-full rounded-lg border px-4 py-3 text-sm text-fg font-mono resize-y focus:outline-none focus:ring-2 ${
              errors.textContent
                ? "border-error focus:ring-error/40"
                : "border-border focus:ring-primary/40 focus:border-primary"
            }`}
          />
          {errors.textContent && (
            <p role="alert" className="text-sm text-error">{errors.textContent}</p>
          )}
        </div>
      )}

      {state.format === "video" && (
        <Input
          label="YouTube video ID"
          value={state.youtubeId}
          onChange={(e) => set({ youtubeId: e.target.value })}
          onBlur={() => onBlur("youtubeId")}
          error={errors.youtubeId}
          placeholder="e.g. dQw4w9WgXcQ"
          helper="The ID part of a YouTube URL: youtube.com/watch?v=<ID>"
        />
      )}

      {state.format === "slides" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-fg">Slides HTML</label>
          <textarea
            value={state.slidesHtml}
            onChange={(e) => set({ slidesHtml: e.target.value })}
            onBlur={() => onBlur("slidesHtml")}
            rows={16}
            placeholder={"<!DOCTYPE html>\n<html>…</html>"}
            className={`w-full rounded-lg border px-4 py-3 text-sm text-fg font-mono resize-y focus:outline-none focus:ring-2 ${
              errors.slidesHtml
                ? "border-error focus:ring-error/40"
                : "border-border focus:ring-primary/40 focus:border-primary"
            }`}
          />
          {errors.slidesHtml && (
            <p role="alert" className="text-sm text-error">{errors.slidesHtml}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Worksheet tab ────────────────────────────────────────────────────────────

function WorksheetTab({
  state,
  onChange,
  onBlur,
  errors,
  preview,
  topicState,
}: {
  state: WorksheetState;
  onChange: (s: WorksheetState) => void;
  onBlur: (field: string) => void;
  errors: Record<string, string>;
  preview: boolean;
  topicState: TopicState;
}) {
  function set(patch: Partial<WorksheetState>) {
    onChange({ ...state, ...patch });
  }

  function updateQuestion(index: number, patch: Partial<EditorQuestion>) {
    set({
      questions: state.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    });
  }

  function addQuestion() {
    set({ questions: [...state.questions, blankQuestion()] });
  }

  function removeQuestion(index: number) {
    set({ questions: state.questions.filter((_, i) => i !== index) });
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const next = [...state.questions];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    set({ questions: next });
  }

  if (preview) {
    const previewableQuestions = editorQuestionsToPayload(
      state.questions.filter((q) => q.text.trim())
    );
    if (!previewableQuestions.length) {
      return <EmptyPreview message="Add at least one question with text to see a preview." />;
    }
    const previewWorksheet: Worksheet = {
      id: `${topicState.subject || "math"}-year${topicState.year || "7"}-${topicState.slug || "preview"}`,
      subject: (topicState.subject as Subject) || "math",
      year: (parseInt(topicState.year) as YearLevel) || 7,
      topicSlug: topicState.slug || "preview",
      title: state.title || "Preview Worksheet",
      questions: previewableQuestions,
    };
    return (
      <WorksheetClient
        worksheet={previewWorksheet}
        topicUrl="/edit"
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Input
          label="Worksheet title"
          value={state.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => onBlur("title")}
          error={errors.title}
          placeholder="e.g. Algebra Intro Practice"
        />
      </div>

      {errors.questions && (
        <p role="alert" className="text-sm text-error mb-4">{errors.questions}</p>
      )}

      <div className="space-y-6">
        {state.questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={idx}
            total={state.questions.length}
            onChange={(patch) => updateQuestion(idx, patch)}
            onRemove={() => removeQuestion(idx)}
            onMove={(dir) => moveQuestion(idx, dir)}
          />
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="mt-6 w-full rounded-xl border-2 border-dashed border-border text-muted hover:border-indigo-300 hover:text-primary transition-colors py-4 text-sm font-semibold min-h-[52px]"
      >
        + Add question
      </button>
    </div>
  );
}

// ─── Empty preview placeholder ────────────────────────────────────────────────

function EmptyPreview({ message }: { message: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
      <p className="text-muted text-sm">{message}</p>
    </div>
  );
}
