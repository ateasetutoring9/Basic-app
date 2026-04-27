"use client";

import { useState } from "react";
import Link from "next/link";
import type { Worksheet, Question } from "@/lib/content/types";
import { gradeWorksheet } from "@/lib/grading";
import type { GradingResult } from "@/lib/grading";
import { Button } from "@/components/ui/Button";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  worksheet: Worksheet;
  topicUrl: string;
  subjectUrl: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorksheetClient({ worksheet, topicUrl, subjectUrl }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"questions" | "results">("questions");
  const [result, setResult] = useState<GradingResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { questions } = worksheet;
  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  // essays don't require an answer to proceed; mcq_multi uses comma-separated indices
  const currentAnswered =
    current.type === "essay" || (answers[current.id] ?? "").trim().length > 0;

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    const graded = gradeWorksheet(worksheet, answers);
    setResult(graded);
    setPhase("results");

    // Fire-and-forget — score shows immediately, save happens via API in background
    (async () => {
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worksheetId: worksheet.id,
            score: graded.score,
            total: graded.total,
            answers,
          }),
        });
        if (res.ok) setIsAuthenticated(true);
      } catch {
        // Non-fatal — score is still shown to the user
      }
    })();
  }

  function handleRetry() {
    setAnswers({});
    setCurrentIndex(0);
    setPhase("questions");
    setResult(null);
  }

  if (phase === "results" && result) {
    return (
      <ResultsScreen
        result={result}
        worksheet={worksheet}
        topicUrl={topicUrl}
        subjectUrl={subjectUrl}
        isAuthenticated={isAuthenticated}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div
          className="h-2 bg-gray-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-label={`Question ${currentIndex + 1} of ${questions.length}`}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <QuestionRenderer
        question={current}
        answer={answers[current.id] ?? ""}
        onAnswer={(val) => setAnswer(current.id, val)}
      />

      {/* Navigation */}
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
          onClick={isLast ? handleSubmit : () => setCurrentIndex((i) => i + 1)}
          disabled={!currentAnswered}
          className="flex-1"
        >
          {isLast ? "Submit" : "Next →"}
        </Button>
      </div>
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────

function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string;
  onAnswer: (val: string) => void;
}) {
  if (question.type === "mcq_single") {
    return (
      <fieldset>
        <legend className="text-xl font-semibold text-fg leading-relaxed mb-6">
          {question.text}
        </legend>
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => {
            const selected = answer === String(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors min-h-[56px] ${
                  selected
                    ? "border-primary bg-indigo-50"
                    : "border-border hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={idx}
                  checked={selected}
                  onChange={() => onAnswer(String(idx))}
                  className="accent-primary w-4 h-4 shrink-0"
                />
                <span className="text-fg leading-relaxed">{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (question.type === "mcq_multi") {
    // answer stored as comma-separated indices e.g. "0,2"
    const selected = answer
      ? answer.split(",").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n))
      : [];
    const toggle = (idx: number) => {
      const next = selected.includes(idx)
        ? selected.filter((i) => i !== idx)
        : [...selected, idx];
      onAnswer(next.sort((a, b) => a - b).join(","));
    };
    return (
      <fieldset>
        <legend className="text-xl font-semibold text-fg leading-relaxed mb-2">
          {question.text}
        </legend>
        <p className="text-sm text-muted mb-5">Select all that apply.</p>
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => {
            const checked = selected.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors min-h-[56px] ${
                  checked
                    ? "border-primary bg-indigo-50"
                    : "border-border hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(idx)}
                  className="accent-primary w-4 h-4 shrink-0"
                />
                <span className="text-fg leading-relaxed">{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (question.type === "numeric") {
    return (
      <div>
        <label
          htmlFor={question.id}
          className="block text-xl font-semibold text-fg leading-relaxed mb-6"
        >
          {question.text}
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            id={question.id}
            type="number"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-40 rounded-xl border border-border px-4 py-3 text-lg text-fg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            placeholder="0"
            inputMode="decimal"
          />
          {question.unit && (
            <span className="text-muted font-medium">{question.unit}</span>
          )}
        </div>
      </div>
    );
  }

  if (question.type === "short_text") {
    return (
      <div>
        <label
          htmlFor={question.id}
          className="block text-xl font-semibold text-fg leading-relaxed mb-6"
        >
          {question.text}
        </label>
        <input
          id={question.id}
          type="text"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-border px-4 py-3 text-lg text-fg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          placeholder="Type your answer…"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    );
  }

  // essay
  return (
    <div>
      <label
        htmlFor={question.id}
        className="block text-xl font-semibold text-fg leading-relaxed mb-6"
      >
        {question.text}
      </label>
      <textarea
        id={question.id}
        value={answer}
        onChange={(e) => onAnswer(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-border px-4 py-3 text-base text-fg min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        placeholder="Write your response here…"
      />
      <p className="text-xs text-muted mt-2">This response is not auto-graded.</p>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function scoreLabel(pct: number) {
  if (pct === 100) return "Perfect score!";
  if (pct >= 80) return "Great work!";
  if (pct >= 60) return "Good progress!";
  if (pct >= 40) return "You're learning — keep going!";
  return "Every attempt counts. Try again!";
}

function scoreRingColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-indigo-600";
  return "text-amber-600";
}

function questionBgColor(correct: boolean) {
  return correct
    ? "border-green-200 bg-green-50"
    : "border-amber-200 bg-amber-50";
}

function answerTextColor(correct: boolean) {
  return correct ? "text-green-700" : "text-amber-700";
}

function ResultsScreen({
  result,
  worksheet,
  topicUrl,
  subjectUrl,
  isAuthenticated,
  onRetry,
}: {
  result: GradingResult;
  worksheet: Worksheet;
  topicUrl: string;
  subjectUrl: string;
  isAuthenticated: boolean;
  onRetry: () => void;
}) {
  const pct = Math.round((result.score / result.total) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Score — aria-live so screen readers announce it immediately */}
      <div aria-live="polite" aria-atomic="true">
        <div className="text-center mb-8 p-8 rounded-2xl bg-white border border-border shadow-sm">
          <div className={`text-6xl font-bold mb-1 ${scoreRingColor(pct)}`}>
            {result.score} / {result.total}
          </div>
          <p className="text-muted text-lg">{pct}% — {scoreLabel(pct)}</p>
        </div>
      </div>

      {/* Guest nudge — encouraging, not punitive */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900" role="status">
          <Link href="/login" className="font-semibold underline underline-offset-2">
            Create a free account
          </Link>{" "}
          to save your progress and watch your scores improve over time.
        </div>
      )}

      {/* Per-question breakdown */}
      <h2 className="text-xl font-bold text-fg mb-4">How did you go?</h2>
      <ul className="flex flex-col gap-4 mb-10">
        {result.results.map((qr) => {
          const question = worksheet.questions.find((q) => q.id === qr.questionId)!;
          return (
            <li
              key={qr.questionId}
              className={`rounded-xl border p-5 ${questionBgColor(qr.correct)}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 text-xl font-bold ${
                    qr.correct ? "text-green-600" : "text-amber-500"
                  }`}
                  aria-label={qr.correct ? "Correct" : "Not quite"}
                >
                  {qr.correct ? "✓" : "○"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-fg mb-2 leading-snug">{question.text}</p>
                  <p className="text-sm text-muted">
                    Your answer:{" "}
                    <span className={`font-semibold ${answerTextColor(qr.correct)}`}>
                      {qr.userAnswer}
                    </span>
                  </p>
                  {!qr.correct && (
                    <p className="text-sm text-muted">
                      Answer:{" "}
                      <span className="font-semibold text-green-700">{qr.correctAnswer}</span>
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
          href={topicUrl}
          className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          ← Back to Lecture
        </Link>
        <Link
          href={subjectUrl}
          className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Browse Topics
        </Link>
      </div>
    </div>
  );
}
