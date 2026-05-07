import Link from "next/link";
import type { Question } from "@/lib/content/types";
import type { WorksheetGradeResult } from "../_lib/grading";
import type { NextTopic } from "../_lib/types";
import { Button } from "@/components/ui/Button";

interface Props {
  result: WorksheetGradeResult;
  questions: Question[];
  topicSyncId: string;
  nextTopic: NextTopic | null;
  onRetry: () => void;
}

function scoreLabel(pct: number) {
  if (pct === 100) return "Perfect score!";
  if (pct >= 80) return "Great work!";
  if (pct >= 60) return "Good progress!";
  if (pct >= 40) return "You're learning — keep going!";
  return "Every attempt counts. Try again!";
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-indigo-600";
  return "text-amber-600";
}

export function ResultsPanel({ result, questions, topicSyncId, nextTopic, onRetry }: Props) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const essayCount = questions.filter((q) => q.type === "essay").length;

  return (
    <div>
      {/* Score banner */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="text-center mb-8 p-8 rounded-2xl bg-white border border-border shadow-sm"
      >
        <div className={`text-6xl font-bold mb-1 ${scoreColor(pct)}`}>
          {result.score} / {result.total}
        </div>
        <p className="text-muted text-lg">
          {result.total > 0 ? `${pct}% — ${scoreLabel(pct)}` : "Submitted."}
        </p>
        {essayCount > 0 && (
          <p className="text-sm text-muted mt-2">
            {essayCount} essay question{essayCount === 1 ? "" : "s"} submitted for
            review.
          </p>
        )}
      </div>

      {/* Per-question breakdown */}
      <h2 className="text-xl font-bold text-fg mb-4">How did you go?</h2>
      <ul className="flex flex-col gap-4 mb-10">
        {result.results.map((qr) => {
          const question = questions.find((q) => q.id === qr.questionId)!;
          const isEssay = qr.correct === null;
          const bgClass = isEssay
            ? "border-border bg-bg"
            : qr.correct
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50";
          return (
            <li key={qr.questionId} className={`rounded-xl border p-5 ${bgClass}`}>
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 text-xl font-bold ${
                    isEssay
                      ? "text-muted"
                      : qr.correct
                      ? "text-green-600"
                      : "text-amber-500"
                  }`}
                  aria-label={
                    isEssay ? "Essay" : qr.correct ? "Correct" : "Incorrect"
                  }
                >
                  {isEssay ? "—" : qr.correct ? "✓" : "○"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-fg mb-2 leading-snug">
                    {question.text}
                  </p>
                  <p className="text-sm text-muted">
                    Your answer:{" "}
                    <span
                      className={`font-semibold ${
                        isEssay
                          ? "text-fg"
                          : qr.correct
                          ? "text-green-700"
                          : "text-amber-700"
                      }`}
                    >
                      {qr.userAnswer}
                    </span>
                  </p>
                  {!isEssay && !qr.correct && (
                    <p className="text-sm text-muted">
                      Answer:{" "}
                      <span className="font-semibold text-green-700">
                        {qr.correctAnswer}
                      </span>
                    </p>
                  )}
                  {isEssay && (
                    <p className="text-sm text-muted italic mt-1">
                      Submitted for review.
                    </p>
                  )}
                  {qr.explanation && (
                    <p className="mt-2 text-sm text-muted italic">{qr.explanation}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" size="lg" onClick={onRetry} className="flex-1">
          Try Again
        </Button>
        <Link
          href={`/learn/${topicSyncId}`}
          className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          ← Back to Lecture
        </Link>
        {nextTopic ? (
          <Link
            href={`/learn/${nextTopic.syncId}`}
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Next: {nextTopic.title} →
          </Link>
        ) : (
          <Link
            href="/browse"
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Browse Topics →
          </Link>
        )}
      </div>
    </div>
  );
}
