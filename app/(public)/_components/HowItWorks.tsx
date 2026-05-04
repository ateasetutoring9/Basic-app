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
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">How it works</h2>
          <p className="text-lg text-muted max-w-lg mx-auto">
            From sign-up to first worksheet in under two minutes.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col">
              <span className="text-5xl font-bold text-primary/20 mb-4 leading-none">{s.number}</span>
              <h3 className="font-semibold text-fg mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
