import Link from "next/link";

export function Hero() {
  return (
    <section className="py-20 md:py-28 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
          100% free · No credit card · No ads
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-fg tracking-tight leading-tight mb-6">
          Ace your studies.<br />Pay nothing.
        </h1>
        <p className="text-xl text-muted leading-relaxed mb-10 max-w-xl mx-auto">
          High-quality lectures, auto-graded worksheets, and instant feedback for Year 7–12 Australian students — completely free, forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold text-lg px-7 py-3.5 min-h-[52px] hover:bg-primary-hover transition-colors duration-150"
          >
            Start learning for free
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center rounded-lg border border-border text-fg font-semibold text-lg px-7 py-3.5 min-h-[52px] hover:bg-white transition-colors duration-150"
          >
            Browse subjects
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          No sign-up required to browse. Create an account to save your progress.
        </p>
      </div>
    </section>
  );
}
