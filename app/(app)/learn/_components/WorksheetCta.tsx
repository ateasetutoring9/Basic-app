import Link from "next/link";
import type { WorksheetMeta } from "../_lib/types";

export function WorksheetCta({ meta }: { meta: WorksheetMeta }) {
  const hasPrior = meta.bestAttempt !== null;

  const subText = hasPrior
    ? `${meta.questionCount} questions · best score so far: ${meta.bestAttempt!.score}/${meta.bestAttempt!.total}`
    : `${meta.questionCount} question${meta.questionCount === 1 ? "" : "s"} · auto-graded · no time limit.`;

  const btnText = hasPrior ? "Try again" : "Start worksheet →";

  return (
    <section
      aria-label="Worksheet"
      className="bg-indigo-50 border-y border-indigo-100 -mx-4 px-4 py-8 my-12"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-fg mb-1">Ready to test yourself?</h2>
        <p className="text-sm text-muted mb-4">{subText}</p>
        <Link
          href={`/worksheet/${meta.syncId}`}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {btnText}
        </Link>
      </div>
    </section>
  );
}
