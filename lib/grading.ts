import type { Worksheet, Question } from "@/lib/content/types";

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export interface GradingResult {
  score: number;
  total: number;
  results: QuestionResult[];
}

export function gradeWorksheet(
  worksheet: Worksheet,
  answers: Record<string, string>
): GradingResult {
  const results = worksheet.questions.map((q) => gradeQuestion(q, answers[q.id] ?? ""));
  return { score: results.filter((r) => r.correct).length, total: results.length, results };
}

function gradeQuestion(question: Question, raw: string): QuestionResult {
  switch (question.type) {
    case "mcq_single": {
      const idx = parseInt(raw, 10);
      const correct = !isNaN(idx) && idx === question.answer;
      return {
        questionId: question.id,
        correct,
        userAnswer: isNaN(idx) ? "(no answer)" : (question.options[idx] ?? raw),
        correctAnswer: question.options[question.answer],
        explanation: question.explanation,
      };
    }

    case "mcq_multi": {
      // raw is a comma-separated list of selected indices e.g. "0,2"
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
        correct,
        userAnswer: raw.trim() || "(no answer)",
        correctAnswer:
          String(question.answer) + (question.unit ? ` ${question.unit}` : ""),
        explanation: question.explanation,
      };
    }

    case "essay": {
      // Essays are not auto-graded; count as submitted, never correct
      return {
        questionId: question.id,
        correct: false,
        userAnswer: raw.trim() || "(no answer)",
        correctAnswer: "(manually graded)",
        explanation: question.hint,
      };
    }
  }
}
