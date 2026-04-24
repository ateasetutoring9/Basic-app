"use client";

import type { Question, Worksheet } from "@/lib/content/types";

// ─── Shared editor state for a single question ────────────────────────────────

export interface EditorQuestion {
  id: string;
  type: "multiple-choice" | "numeric" | "fill-blank";
  text: string;
  explanation: string;
  // multiple-choice
  options: string[];
  mcAnswer: number;
  // numeric
  numAnswer: string;
  tolerance: string;
  unit: string;
  // fill-blank
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

export function blankQuestion(): EditorQuestion {
  return {
    id: `q${Date.now()}`,
    type: "multiple-choice",
    text: "",
    explanation: "",
    options: ["", ""],
    mcAnswer: 0,
    numAnswer: "",
    tolerance: "",
    unit: "",
    acceptedAnswers: [""],
    caseSensitive: false,
  };
}

export function worksheetToEditorQuestions(ws: Worksheet): EditorQuestion[] {
  return ws.questions.map((q) => {
    const base: EditorQuestion = {
      id: q.id,
      type: q.type,
      text: q.text,
      explanation: q.explanation ?? "",
      options: ["", ""],
      mcAnswer: 0,
      numAnswer: "",
      tolerance: "",
      unit: "",
      acceptedAnswers: [""],
      caseSensitive: false,
    };
    if (q.type === "multiple-choice") {
      return { ...base, options: [...q.options], mcAnswer: q.answer };
    }
    if (q.type === "numeric") {
      return {
        ...base,
        numAnswer: String(q.answer),
        tolerance: q.tolerance != null ? String(q.tolerance) : "",
        unit: q.unit ?? "",
      };
    }
    return {
      ...base,
      acceptedAnswers: [...q.acceptedAnswers],
      caseSensitive: q.caseSensitive ?? false,
    };
  });
}

export function editorQuestionsToPayload(questions: EditorQuestion[]): Question[] {
  return questions.map((q) => {
    if (q.type === "multiple-choice") {
      return {
        type: "multiple-choice" as const,
        id: q.id,
        text: q.text,
        options: q.options,
        answer: q.mcAnswer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      };
    }
    if (q.type === "numeric") {
      return {
        type: "numeric" as const,
        id: q.id,
        text: q.text,
        answer: parseFloat(q.numAnswer),
        ...(q.tolerance ? { tolerance: parseFloat(q.tolerance) } : {}),
        ...(q.unit ? { unit: q.unit } : {}),
        ...(q.explanation ? { explanation: q.explanation } : {}),
      };
    }
    return {
      type: "fill-blank" as const,
      id: q.id,
      text: q.text,
      acceptedAnswers: q.acceptedAnswers.filter(Boolean),
      ...(q.caseSensitive ? { caseSensitive: true } : {}),
      ...(q.explanation ? { explanation: q.explanation } : {}),
    };
  });
}

// ─── QuestionEditor component ─────────────────────────────────────────────────

interface QuestionEditorProps {
  question: EditorQuestion;
  index: number;
  total: number;
  onChange: (patch: Partial<EditorQuestion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  errors?: Record<string, string>;
}

export function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  errors = {},
}: QuestionEditorProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm font-bold text-muted w-7 shrink-0">Q{index + 1}</span>

        <select
          value={question.type}
          onChange={(e) => onChange({ type: e.target.value as EditorQuestion["type"] })}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[36px]"
        >
          <option value="multiple-choice">Multiple choice</option>
          <option value="numeric">Numeric</option>
          <option value="fill-blank">Fill in the blank</option>
        </select>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1.5 rounded text-muted hover:text-fg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            aria-label="Move up"
          >▲</button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded text-muted hover:text-fg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            aria-label="Move down"
          >▼</button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            aria-label="Remove question"
          >✕</button>
        </div>
      </div>

      {/* Question text */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-muted mb-1">Question text</label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 resize-none ${
            errors.text
              ? "border-error focus:ring-error/40"
              : "border-border focus:ring-primary/40 focus:border-primary"
          }`}
          placeholder={
            question.type === "fill-blank"
              ? "Use ___ for the blank, e.g. The capital of Australia is ___"
              : "Enter the question…"
          }
        />
        {errors.text && (
          <p role="alert" className="text-sm text-error mt-1">{errors.text}</p>
        )}
      </div>

      {/* Type-specific fields */}
      {question.type === "multiple-choice" && (
        <MultipleChoiceFields question={question} onChange={onChange} errors={errors} />
      )}
      {question.type === "numeric" && (
        <NumericFields question={question} onChange={onChange} errors={errors} />
      )}
      {question.type === "fill-blank" && (
        <FillBlankFields question={question} onChange={onChange} errors={errors} />
      )}

      {/* Explanation (optional) */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="block text-xs font-semibold text-muted mb-1">
          Explanation <span className="font-normal">(optional — shown after answering)</span>
        </label>
        <input
          value={question.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[36px]"
          placeholder="Why is this the correct answer?"
        />
      </div>
    </div>
  );
}

// ─── Multiple choice fields ───────────────────────────────────────────────────

function MultipleChoiceFields({
  question,
  onChange,
  errors,
}: {
  question: EditorQuestion;
  onChange: (patch: Partial<EditorQuestion>) => void;
  errors: Record<string, string>;
}) {
  function updateOption(i: number, value: string) {
    const next = [...question.options];
    next[i] = value;
    onChange({ options: next });
  }
  function addOption() {
    onChange({ options: [...question.options, ""] });
  }
  function removeOption(i: number) {
    if (question.options.length <= 2) return;
    const next = question.options.filter((_, idx) => idx !== i);
    onChange({ options: next, mcAnswer: Math.min(question.mcAnswer, next.length - 1) });
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-2">
        Options — select the correct one
      </label>
      {errors.options && (
        <p role="alert" className="text-sm text-error mb-2">{errors.options}</p>
      )}
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`mc-answer-${question.id}`}
              checked={question.mcAnswer === i}
              onChange={() => onChange({ mcAnswer: i })}
              className="accent-primary shrink-0"
              aria-label={`Mark option ${i + 1} as correct`}
            />
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[36px]"
              placeholder={`Option ${i + 1}`}
            />
            <button
              onClick={() => removeOption(i)}
              disabled={question.options.length <= 2}
              className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors shrink-0"
              aria-label="Remove option"
            >✕</button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-2 text-xs font-semibold text-primary hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}

// ─── Numeric fields ───────────────────────────────────────────────────────────

function NumericFields({
  question,
  onChange,
  errors,
}: {
  question: EditorQuestion;
  onChange: (patch: Partial<EditorQuestion>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Correct answer</label>
        <input
          type="number"
          value={question.numAnswer}
          onChange={(e) => onChange({ numAnswer: e.target.value })}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 min-h-[36px] ${
            errors.numAnswer
              ? "border-error focus:ring-error/40"
              : "border-border focus:ring-primary/40 focus:border-primary"
          }`}
          placeholder="e.g. 42"
        />
        {errors.numAnswer && (
          <p role="alert" className="text-sm text-error mt-1">{errors.numAnswer}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Tolerance (±)</label>
        <input
          type="number"
          min="0"
          value={question.tolerance}
          onChange={(e) => onChange({ tolerance: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[36px]"
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Unit (optional)</label>
        <input
          value={question.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[36px]"
          placeholder="e.g. m/s"
        />
      </div>
    </div>
  );
}

// ─── Fill-blank fields ────────────────────────────────────────────────────────

function FillBlankFields({
  question,
  onChange,
  errors,
}: {
  question: EditorQuestion;
  onChange: (patch: Partial<EditorQuestion>) => void;
  errors: Record<string, string>;
}) {
  function updateAnswer(i: number, value: string) {
    const next = [...question.acceptedAnswers];
    next[i] = value;
    onChange({ acceptedAnswers: next });
  }
  function addAnswer() {
    onChange({ acceptedAnswers: [...question.acceptedAnswers, ""] });
  }
  function removeAnswer(i: number) {
    if (question.acceptedAnswers.length <= 1) return;
    onChange({ acceptedAnswers: question.acceptedAnswers.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-2">
        Accepted answers{" "}
        <span className="font-normal">(add variations for different correct phrasings)</span>
      </label>
      {errors.acceptedAnswers && (
        <p role="alert" className="text-sm text-error mb-2">{errors.acceptedAnswers}</p>
      )}
      <div className="space-y-2">
        {question.acceptedAnswers.map((ans, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={ans}
              onChange={(e) => updateAnswer(i, e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[36px]"
              placeholder={`Accepted answer ${i + 1}`}
            />
            <button
              onClick={() => removeAnswer(i)}
              disabled={question.acceptedAnswers.length <= 1}
              className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors shrink-0"
              aria-label="Remove answer"
            >✕</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={addAnswer}
          className="text-xs font-semibold text-primary hover:underline"
        >
          + Add variation
        </button>
        <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={question.caseSensitive}
            onChange={(e) => onChange({ caseSensitive: e.target.checked })}
            className="accent-primary"
          />
          Case sensitive
        </label>
      </div>
    </div>
  );
}
