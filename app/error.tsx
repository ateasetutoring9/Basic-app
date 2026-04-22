"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Error</p>
      <h1 className="text-3xl font-bold text-fg mb-3">Something went wrong</h1>
      <p className="text-muted max-w-sm mb-8 leading-relaxed">
        We hit an unexpected snag. Your progress is safe — please try again.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl border-2 border-fg text-fg font-semibold hover:bg-fg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
