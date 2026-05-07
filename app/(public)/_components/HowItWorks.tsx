const steps = [
  {
    number: "01",
    title: "Create your free account",
    description: "Sign up in under 30 seconds. No payment details, no email confirmation to wait for.",
  },
  {
    number: "02",
    title: "Pick your topic",
    description: "Browse by year level and subject. Jump straight to the topic you need help with.",
  },
  {
    number: "03",
    title: "Learn at your pace",
    description: "Watch the video or read through the text lecture — however you learn best.",
  },
  {
    number: "04",
    title: "Test your understanding",
    description: "Attempt the worksheet and get instant, question-by-question feedback the moment you submit.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 px-4 bg-panel border-y border-border">
      <div className="max-w-page mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-section-title text-fg mb-4">How it works</h2>
          <p className="text-body text-muted max-w-lg mx-auto">
            From sign-up to first worksheet in under two minutes.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col">
              <span className="font-display text-5xl font-medium text-accent/20 mb-4 leading-none">
                {s.number}
              </span>
              <h3 className="text-subsection-title text-fg mb-2">{s.title}</h3>
              <p className="text-small text-muted leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
