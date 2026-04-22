import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">404</p>
      <h1 className="text-3xl font-bold text-fg mb-3">Page not found</h1>
      <p className="text-muted max-w-sm mb-8 leading-relaxed">
        We couldn&apos;t find what you were looking for. It may have moved, or the
        link might be out of date.
      </p>
      <Link
        href="/browse"
        className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Browse topics
      </Link>
    </main>
  );
}
