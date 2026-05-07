import type { Question } from "@/lib/content/types";

interface Props {
  question: Question;
  answer: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function QuestionInput({ question, answer, onChange, disabled = false }: Props) {
  if (question.type === "mcq_single") {
    return (
      <fieldset disabled={disabled}>
        <legend className="text-xl font-semibold text-fg leading-relaxed mb-6">
          {question.text}
        </legend>
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => {
            const selected = answer === String(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors min-h-[56px] ${
                  disabled
                    ? "opacity-70 cursor-default"
                    : "cursor-pointer"
                } ${
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
                  onChange={() => onChange(String(idx))}
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
    const selected = answer
      ? answer.split(",").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n))
      : [];
    const toggle = (idx: number) => {
      if (disabled) return;
      const next = selected.includes(idx)
        ? selected.filter((i) => i !== idx)
        : [...selected, idx];
      onChange(next.sort((a, b) => a - b).join(","));
    };
    return (
      <fieldset disabled={disabled}>
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
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors min-h-[56px] ${
                  disabled
                    ? "opacity-70 cursor-default"
                    : "cursor-pointer"
                } ${
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
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-40 rounded-xl border border-border px-4 py-3 text-lg text-fg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-70"
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
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full max-w-sm rounded-xl border border-border px-4 py-3 text-lg text-fg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-70"
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
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
        className="w-full rounded-xl border border-border px-4 py-3 text-base text-fg min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-70"
        placeholder="Write your response here…"
      />
      <p className="text-xs text-muted mt-2">This response is not auto-graded.</p>
    </div>
  );
}
