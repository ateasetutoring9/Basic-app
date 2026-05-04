export function FoundingBanner() {
  // TODO: Replace hardcoded spot count with a live DB count once founding cohort tracking is implemented
  return (
    <div className="bg-indigo-50 border-y border-indigo-100 py-3 px-4 text-center">
      <p className="text-sm font-medium text-indigo-800">
        <span className="font-bold">247 founding spots remaining</span> — join now and shape the platform from day one.{" "}
        <a href="#cta" className="underline hover:no-underline">
          Claim yours
        </a>
      </p>
    </div>
  );
}
