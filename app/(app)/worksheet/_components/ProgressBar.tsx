interface Props {
  current: number; // 1-based
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted mb-2">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
