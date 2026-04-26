"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  QuestionEditor,
  blankQuestion,
  worksheetToEditorQuestions,
  editorQuestionsToPayload,
} from "@/components/admin/QuestionEditor";
import type { EditorQuestion } from "@/components/admin/QuestionEditor";
import type { Worksheet } from "@/lib/content/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  topicId: number;
  topicSyncId: string;
  topicTitle: string;
  initialWorksheet: Worksheet | null;
  /** Number of existing attempts — triggers a confirmation before overwriting */
  attemptCount?: number;
  /** Where to navigate after a successful delete */
  backHref?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorksheetEditorClient({
  topicId,
  topicSyncId,
  topicTitle,
  initialWorksheet,
  attemptCount = 0,
  backHref,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initialWorksheet?.title ?? `${topicTitle} Worksheet`);
  const [difficulty, setDifficulty] = useState(initialWorksheet?.difficulty ?? 1);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialWorksheet ? worksheetToEditorQuestions(initialWorksheet) : [blankQuestion()]
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const isDirty = useRef(false);

  // Warn on browser tab close / refresh when unsaved changes exist
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty.current) { e.preventDefault(); }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function markDirty() { isDirty.current = true; }

  async function handleSave() {
    // Step 8: if attempts already exist, confirm before overwriting questions
    if (attemptCount > 0) {
      const ok = confirm(
        `${attemptCount} student attempt${attemptCount !== 1 ? "s" : ""} already exist for this worksheet.\n\n` +
        `Editing questions will not change past attempt scores, but the questions students ` +
        `answered may no longer match the current version.\n\nContinue and save?`
      );
      if (!ok) return;
    }

    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topicSyncId,
          title,
          questions: editorQuestionsToPayload(questions),
          difficulty,
          isPublished,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ? JSON.stringify(data.error) : "Save failed");
      }
      isDirty.current = false;
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this worksheet? Existing attempt records will be preserved but the worksheet will no longer be accessible.")) return;
    setStatus("deleting");
    try {
      await fetch(`/api/admin/worksheet?topicSyncId=${topicSyncId}`, { method: "DELETE" });
      isDirty.current = false;
      if (backHref) router.push(backHref);
    } catch {
      setStatus("error");
      setErrorMsg("Delete failed");
    }
  }

  function updateQuestion(index: number, patch: Partial<EditorQuestion>) {
    markDirty();
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    markDirty();
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function removeQuestion(index: number) {
    markDirty();
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    markDirty();
    setQuestions((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  const isBusy = status === "saving" || status === "deleting";

  return (
    <div className="max-w-3xl">
      {/* Attempt warning banner */}
      {attemptCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <strong>{attemptCount} student attempt{attemptCount !== 1 ? "s" : ""}</strong> exist for this worksheet.
          {" "}Editing questions will not change past scores.
        </div>
      )}

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-fg">{topicTitle}</h2>
          <p className="text-sm text-muted mt-0.5">Worksheet editor</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {initialWorksheet && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={isBusy}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {status === "deleting" ? "Deleting…" : "Delete worksheet"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isBusy}>
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save worksheet"}
          </Button>
        </div>
      </div>

      {status === "error" && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-fg mb-1.5">Worksheet title</label>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[44px]"
          placeholder="e.g. Algebra Intro Practice"
        />
      </div>

      {/* Difficulty + published */}
      <div className="flex items-center gap-6 mb-8 p-4 rounded-lg bg-gray-50 border border-border">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted">Difficulty</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); markDirty(); }}
                className={`w-8 h-8 rounded text-sm font-semibold transition-colors ${
                  difficulty === d
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => { setIsPublished(e.target.checked); markDirty(); }}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-medium text-fg">Published</span>
        </label>
      </div>

      {/* Question list */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={idx}
            total={questions.length}
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

      {/* Bottom save bar */}
      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
        {initialWorksheet && (
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={isBusy}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {status === "deleting" ? "Deleting…" : "Delete worksheet"}
          </Button>
        )}
        <Button size="lg" onClick={handleSave} disabled={isBusy}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save worksheet"}
        </Button>
      </div>
    </div>
  );
}
