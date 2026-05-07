"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { WorksheetData, NextTopic } from "../_lib/types";
import type { WorksheetGradeResult } from "../_lib/grading";
import { gradeAnswers } from "../_lib/grading";
import { ProgressBar } from "../_components/ProgressBar";
import { QuestionInput } from "../_components/QuestionInput";
import { ReviewPanel } from "../_components/ReviewPanel";
import { ResultsPanel } from "../_components/ResultsPanel";

type Phase = "taking" | "review" | "results";

interface Props {
  worksheet: WorksheetData;
  nextTopic: NextTopic | null;
}

const draftKey = (syncId: string) => `worksheet:${syncId}:draft`;

export function WorksheetClient({ worksheet, nextTopic }: Props) {
  const [phase, setPhase] = useState<Phase>("taking");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WorksheetGradeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { questions, syncId } = worksheet;

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(syncId));
      if (raw) setAnswers(JSON.parse(raw) as Record<string, string>);
    } catch {
      // localStorage unavailable — ignore
    }
  }, [syncId]);

  // Auto-save draft while taking
  useEffect(() => {
    if (phase !== "taking") return;
    try {
      localStorage.setItem(draftKey(syncId), JSON.stringify(answers));
    } catch {
      // ignore
    }
  }, [answers, syncId, phase]);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function editQuestion(index: number) {
    setCurrentIndex(index);
    setPhase("taking");
  }

  async function confirmSubmit() {
    setIsSubmitting(true);

    const graded = gradeAnswers(questions, answers);
    setResult(graded);

    try { localStorage.removeItem(draftKey(syncId)); } catch { /* ignore */ }

    // Fire-and-forget — score shown immediately, API saves in background
    fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worksheetId: worksheet.id,
        score: graded.score,
        total: graded.total,
        answers,
      }),
    }).catch(() => {
      // Non-fatal
    });

    setIsSubmitting(false);
    setPhase("results");
  }

  function handleRetry() {
    setAnswers({});
    setCurrentIndex(0);
    setPhase("taking");
    setResult(null);
  }

  if (phase === "review") {
    return (
      <ReviewPanel
        questions={questions}
        answers={answers}
        onEdit={editQuestion}
        onConfirm={confirmSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <ResultsPanel
        result={result}
        questions={questions}
        topicSyncId={worksheet.topic.syncId}
        nextTopic={nextTopic}
        onRetry={handleRetry}
      />
    );
  }

  // Taking phase
  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswered =
    current.type === "essay" || (answers[current.id] ?? "").trim().length > 0;

  return (
    <div>
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <QuestionInput
        question={current}
        answer={answers[current.id] ?? ""}
        onChange={(val) => setAnswer(current.id, val)}
      />

      <div className="flex gap-3 mt-10 pt-6 border-t border-border">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          ← Previous
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={isLast ? () => setPhase("review") : () => setCurrentIndex((i) => i + 1)}
          disabled={!currentAnswered}
          className="flex-1"
        >
          {isLast ? "Review →" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
