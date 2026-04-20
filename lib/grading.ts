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
    case "multiple-choice": {
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

    case "fill-blank": {
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
  }
}
