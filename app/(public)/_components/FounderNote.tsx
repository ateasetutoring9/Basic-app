export function FounderNote() {
  // TODO: Replace placeholder initials, name, and bio with real founder photo and details
  return (
    <section className="py-16 md:py-24 px-4 bg-card border-y border-border" id="founding">
      <div className="max-w-reading mx-auto">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-[var(--accent-text-on)] text-2xl font-bold select-none">
              MK
            </div>
            <div className="text-center">
              <p className="text-small font-semibold text-fg">Founder</p>
              <p className="text-small text-muted">At Ease Learning</p>
            </div>
          </div>
          <div>
            <h2 className="text-subsection-title text-fg mb-4">Why we built this</h2>
            <div className="space-y-4 text-body text-muted leading-relaxed">
              <p>
                Every student deserves access to the same quality of education — regardless of whether their family can afford a private tutor.
              </p>
              <p>
                We built At Ease Learning because we kept seeing the same pattern: students who understood the concepts but needed just a bit more practice and feedback to get over the line. That kind of support is expensive to get privately. It shouldn&apos;t be.
              </p>
              <p>
                If you&apos;re a founding member, you get to influence what subjects and topics we build out first. We read every piece of feedback. Your experience matters to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
