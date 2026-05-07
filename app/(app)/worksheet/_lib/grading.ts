import type { Question } from "@/lib/content/types";

export interface QuestionResult {
  questionId: string;
  type: Question["type"];
  correct: boolean | null; // null = essay (not auto-graded)
  userAnswer: string;
  correctAnswer: string | null; // null for essays
  explanation?: string;
}

export interface WorksheetGradeResult {
  score: number; // correct auto-graded answers; essays excluded
  total: number; // auto-graded question count; essays excluded
  results: QuestionResult[];
}

export function gradeAnswers(
  questions: Question[],
  answers: Record<string, string>
): WorksheetGradeResult {
  const results = questions.map((q) => gradeOne(q, answers[q.id] ?? ""));
  const graded = results.filter((r) => r.correct !== null);
  return {
    score: graded.filter((r) => r.correct === true).length,
    total: graded.length,
    results,
  };
}

function gradeOne(question: Question, raw: string): QuestionResult {
  switch (question.type) {
    case "mcq_single": {
      const idx = parseInt(raw, 10);
      const correct = !isNaN(idx) && idx === question.answer;
      return {
        questionId: question.id,
        type: question.type,
        correct,
        userAnswer: isNaN(idx) ? "(no answer)" : (question.options[idx] ?? raw),
        correctAnswer: question.options[question.answer],
        explanation: question.explanation,
      };
    }
    case "mcq_multi": {
      const selected = raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      const expected = [...question.answers].sort((a, b) => a - b);
      const correct =
        selected.length === expected.length &&
        selected.every((v, i) => v === expected[i]);
      return {
        questionId: question.id,
        type: question.type,
        correct,
        userAnswer: selected.length
          ? selected.map((i) => question.options[i] ?? String(i)).join(", ")
          : "(no answer)",
        correctAnswer: expected.map((i) => question.options[i] ?? String(i)).join(", "),
        explanation: question.explanation,
      };
    }
    case "short_text": {
      const trimmed = raw.trim();
      const correct =
        trimmed.length > 0 &&
        question.acceptedAnswers.some((a) =>
          question.caseSensitive
            ? trimmed === a
            : trimmed.toLowerCase() === a.toLowerCase()
        );
      return {
        questionId: question.id,
        type: question.type,
        correct,
        userAnswer: trimmed || "(no answer)",
        correctAnswer: question.acceptedAnswers[0],
        explanation: question.explanation,
      };
    }
    case "numeric": {
      const n = parseFloat(raw);
      const tol = question.tolerance ?? 0;
      const correct = !isNaN(n) && Math.abs(n - question.answer) <= tol;
      return {
        questionId: question.id,
        type: question.type,
        correct,
        userAnswer: raw.trim() || "(no answer)",
        correctAnswer:
          String(question.answer) + (question.unit ? ` ${question.unit}` : ""),
        explanation: question.explanation,
      };
    }
    case "essay": {
      return {
        questionId: question.id,
        type: question.type,
        correct: null,
        userAnswer: raw.trim() || "(no answer)",
        correctAnswer: null,
        explanation: question.hint,
      };
    }
  }
}
