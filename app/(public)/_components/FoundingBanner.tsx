export function FoundingBanner() {
  // TODO: Replace hardcoded spot count with a live DB count once founding cohort tracking is implemented
  return (
    <div className="bg-panel border-y border-border py-3 px-4 text-center">
      <p className="text-small font-medium text-fg">
        <strong>247 founding spots remaining</strong> — join now and shape the platform from day one.{" "}
        <a href="#cta" className="underline hover:no-underline text-accent">
          Claim yours
        </a>
      </p>
    </div>
  );
}
