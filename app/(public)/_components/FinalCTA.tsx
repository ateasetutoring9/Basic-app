import Link from "next/link";

// TODO: Replace hardcoded spot count with a live DB count once founding cohort tracking is implemented
export function FinalCTA() {
  return (
    <section className="bg-indigo-50 border-y border-indigo-100 py-20 px-4 text-center" id="cta">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-indigo-700 uppercase tracking-widest mb-4">
          247 founding spots remaining
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">
          Start learning for free today
        </h2>
        <p className="text-lg text-muted mb-10 max-w-md mx-auto">
          Join Australia&apos;s newest free education platform and help shape what gets built next.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold text-lg px-8 py-4 min-h-[56px] hover:bg-primary-hover transition-colors duration-150"
        >
          Create your free account
        </Link>
        <p className="mt-5 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
