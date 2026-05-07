import type { Question } from "@/lib/content/types";
import { Button } from "@/components/ui/Button";

interface Props {
  questions: Question[];
  answers: Record<string, string>;
  onEdit: (index: number) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

function summariseAnswer(question: Question, raw: string): string {
  if (!raw.trim()) return "(no answer)";
  if (question.type === "mcq_single") {
    const idx = parseInt(raw, 10);
    return isNaN(idx) ? raw : (question.options[idx] ?? raw);
  }
  if (question.type === "mcq_multi") {
    const selected = raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    return selected.length
      ? selected.map((i) => question.options[i] ?? String(i)).join(", ")
      : "(no answer)";
  }
  return raw.trim();
}

export function ReviewPanel({ questions, answers, onEdit, onConfirm, isSubmitting }: Props) {
  const unanswered = questions.filter(
    (q) => q.type !== "essay" && !(answers[q.id] ?? "").trim()
  ).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-fg mb-2">Review your answers</h2>
      <p className="text-muted mb-6">
        Check your answers below. You can edit any question before submitting.
      </p>

      {unanswered > 0 && (
        <div
          className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800"
          role="status"
        >
          {unanswered} question{unanswered === 1 ? " is" : "s are"} unanswered.
        </div>
      )}

      <ul className="flex flex-col gap-3 mb-8">
        {questions.map((q, i) => {
          const summary = summariseAnswer(q, answers[q.id] ?? "");
          const empty = q.type !== "essay" && !(answers[q.id] ?? "").trim();
          return (
            <li
              key={q.id}
              className={`rounded-xl border p-4 flex items-start gap-4 ${
                empty ? "border-amber-200 bg-amber-50" : "border-border bg-bg"
              }`}
            >
              <span className="shrink-0 text-sm font-semibold text-muted w-6 pt-0.5">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-fg text-sm leading-snug mb-1">{q.text}</p>
                <p className={`text-sm ${empty ? "text-amber-700 italic" : "text-muted"}`}>
                  {q.type === "essay" ? (
                    <span className="italic">Essay response</span>
                  ) : (
                    summary
                  )}
                </p>
              </div>
              <button
                onClick={() => onEdit(i)}
                className="shrink-0 text-sm text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
              >
                Edit
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => onEdit(questions.length - 1)}
          className="flex-1"
        >
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Submitting…" : "Confirm & Submit"}
        </Button>
      </div>
    </div>
  );
}
