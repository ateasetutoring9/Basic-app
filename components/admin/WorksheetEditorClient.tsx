"use client";

import { useState } from "react";
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorksheetEditorClient({ topicId, topicSyncId, topicTitle, initialWorksheet }: Props) {
  const [title, setTitle] = useState(initialWorksheet?.title ?? `${topicTitle} Worksheet`);
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialWorksheet ? worksheetToEditorQuestions(initialWorksheet) : [blankQuestion()]
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const apiBase = `/api/admin/worksheet`;

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topicSyncId,
          title,
          questions: editorQuestionsToPayload(questions),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ? JSON.stringify(data.error) : "Save failed");
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this worksheet? This cannot be undone.")) return;
    setStatus("deleting");
    try {
      await fetch(`${apiBase}?topicSyncId=${topicSyncId}`, { method: "DELETE" });
      setQuestions([blankQuestion()]);
      setTitle(`${topicTitle} Worksheet`);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Delete failed");
    }
  }

  function updateQuestion(index: number, patch: Partial<EditorQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">{topicTitle}</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {initialWorksheet && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={status === "deleting" || status === "saving"}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {status === "deleting" ? "Deleting…" : "Delete worksheet"}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={status === "saving" || status === "deleting"}
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save worksheet"}
          </Button>
        </div>
      </div>

      {status === "error" && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="mb-8">
        <label className="block text-sm font-semibold text-fg mb-1.5">Worksheet title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[44px]"
          placeholder="e.g. Algebra Intro Practice"
        />
      </div>

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

      <div className="mt-8 flex justify-end gap-3">
        {initialWorksheet && (
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={status === "deleting" || status === "saving"}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {status === "deleting" ? "Deleting…" : "Delete worksheet"}
          </Button>
        )}
        <Button
          size="lg"
          onClick={handleSave}
          disabled={status === "saving" || status === "deleting"}
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save worksheet"}
        </Button>
      </div>
    </div>
  );
}
