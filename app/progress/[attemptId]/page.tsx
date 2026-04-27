"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { gradeWorksheet } from "@/lib/grading";
import type { Question } from "@/lib/content/types";
import type { GradingResult } from "@/lib/grading";

interface AttemptDetail {
  id: number;
  score: number;
  total: number;
  answers: Record<string, string>;
  created_at: string;
  topicSyncId: string | null;
  worksheet: {
    id: number;
    title: string;
    questions: Question[];
  };
}

function scoreRingColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-indigo-600";
  return "text-amber-600";
}

function scoreLabel(pct: number) {
  if (pct === 100) return "Perfect score!";
  if (pct >= 80) return "Great work!";
  if (pct >= 60) return "Good progress!";
  if (pct >= 40) return "You're learning — keep going!";
  return "Every attempt counts. Try again!";
}

export default function AttemptReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/attempts/${attemptId}`, { credentials: "include" });
      if (res.status === 401) { router.replace("/login"); return; }
      if (!res.ok) { setLoading(false); return; }
      const data: AttemptDetail = await res.json();
      setAttempt(data);

      // Re-grade using stored answers so per-question breakdown is accurate
      const graded = gradeWorksheet(
        { id: data.worksheet.id, syncId: "", title: data.worksheet.title, questions: data.worksheet.questions, difficulty: 1 },
        data.answers
      );
      setResult(graded);
      setLoading(false);
    })();
  }, [attemptId, router]);

  if (loading) {
    return (
      <PageContainer as="main">
        <p className="text-muted animate-pulse">Loading attempt…</p>
      </PageContainer>
    );
  }

  if (!attempt || !result) {
    return (
      <PageContainer as="main">
        <p className="text-muted">Attempt not found.</p>
        <Link href="/progress" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to Progress</Link>
      </PageContainer>
    );
  }

  const pct = Math.round((result.score / result.total) * 100);
  const attemptDate = new Date(attempt.created_at).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <PageContainer as="main">
      <Link href="/progress" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors mb-6">
        ← My Progress
      </Link>

      <h1 className="text-2xl font-bold text-fg mb-1">{attempt.worksheet.title}</h1>
      <p className="text-sm text-muted mb-8">Attempted on {attemptDate}</p>

      {/* Score */}
      <div className="text-center mb-8 p-8 rounded-2xl bg-white border border-border shadow-sm">
        <div className={`text-6xl font-bold mb-1 ${scoreRingColor(pct)}`}>
          {result.score} / {result.total}
        </div>
        <p className="text-muted text-lg">{pct}% — {scoreLabel(pct)}</p>
      </div>

      {/* Per-question breakdown */}
      <h2 className="text-xl font-bold text-fg mb-4">Question breakdown</h2>
      <ul className="flex flex-col gap-4 mb-10">
        {result.results.map((qr) => {
          const question = attempt.worksheet.questions.find((q) => q.id === qr.questionId);
          if (!question) return null;
          const correct = qr.correct;
          return (
            <li
              key={qr.questionId}
              className={`rounded-xl border p-5 ${correct ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 text-xl font-bold ${correct ? "text-green-600" : "text-amber-500"}`}>
                  {correct ? "✓" : "○"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-fg mb-2 leading-snug">{question.text}</p>
                  <p className="text-sm text-muted">
                    Your answer:{" "}
                    <span className={`font-semibold ${correct ? "text-green-700" : "text-amber-700"}`}>
                      {qr.userAnswer}
                    </span>
                  </p>
                  {!correct && (
                    <p className="text-sm text-muted">
                      Answer:{" "}
                      <span className="font-semibold text-green-700">{qr.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/progress"
          className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors"
        >
          ← My Progress
        </Link>
        {attempt.topicSyncId && (
          <Link
            href={`/worksheet/${attempt.topicSyncId}`}
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-7 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors"
          >
            Try Again
          </Link>
        )}
      </div>
    </PageContainer>
  );
}
