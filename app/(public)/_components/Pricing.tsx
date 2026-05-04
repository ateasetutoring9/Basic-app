const tiers = [
  {
    label: "Private tutoring",
    price: "$80–120",
    unit: "per hour",
    note: "Market average, Australia 2025",
    features: [
      "One-on-one attention",
      "Flexible scheduling",
      "High cost, hard to sustain",
      "Quality varies widely",
    ],
    highlighted: false,
    cta: null as null | { href: string; label: string },
  },
  {
    label: "At Ease Learning",
    price: "Free",
    unit: "forever",
    note: "No credit card. No premium tier.",
    features: [
      "All lectures & worksheets",
      "Instant worksheet feedback",
      "Progress tracking",
      "New content added regularly",
    ],
    highlighted: true,
    cta: { href: "/signup", label: "Get started free" },
  },
  {
    label: "Online tutoring platforms",
    price: "$30–60",
    unit: "per month",
    note: "Subscription, often paywalled",
    features: [
      "Large content libraries",
      "Practice questions",
      "Ongoing subscription cost",
      "Often not AU curriculum-aligned",
    ],
    highlighted: false,
    cta: null as null | { href: string; label: string },
  },
];

// TODO: Update pricing comparison if At Ease introduces any paid features (currently: none planned)
export function Pricing() {
  return (
    <section className="py-16 md:py-24 px-4 bg-white border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">The honest comparison</h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Quality education doesn&apos;t have to cost anything. Here&apos;s how we stack up.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {tiers.map((t) => (
            <div
              key={t.label}
              className={`rounded-xl border p-6 flex flex-col gap-4 ${
                t.highlighted
                  ? "border-primary bg-white shadow-md ring-2 ring-primary"
                  : "border-border bg-white"
              }`}
            >
              {t.highlighted && (
                <span className="inline-flex self-start text-xs font-bold text-white bg-primary rounded-full px-3 py-1">
                  Recommended
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-muted mb-1">{t.label}</p>
                <p className="text-3xl font-bold text-fg">
                  {t.price}
                  <span className="text-base font-normal text-muted ml-1.5">{t.unit}</span>
                </p>
                <p className="text-xs text-muted mt-1">{t.note}</p>
              </div>
              <ul className="space-y-2 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success mt-0.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {t.cta && (
                <a
                  href={t.cta.href}
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold text-base px-5 py-3 hover:bg-primary-hover transition-colors duration-150 mt-2"
                >
                  {t.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
