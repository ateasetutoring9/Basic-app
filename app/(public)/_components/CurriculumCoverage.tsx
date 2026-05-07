const boards = [
  "Australian Curriculum v9",
  "VCE (Victoria)",
  "HSC (NSW)",
  "QCE (Queensland)",
  "ATAR (WA)",
  "SACE (South Australia)",
  "TCE (Tasmania)",
  "BSSS (ACT)",
  "NTCET (Northern Territory)",
];

export function CurriculumCoverage() {
  return (
    <section className="py-16 md:py-24 px-4 bg-card border-y border-border">
      <div className="max-w-page mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-section-title text-fg mb-4">Built for Australian students</h2>
          <p className="text-body text-muted max-w-xl mx-auto">
            Content is aligned to the Australian Curriculum and mapped to every state and territory&apos;s senior secondary framework.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {boards.map((board) => (
            <span
              key={board}
              className="inline-flex items-center px-3 py-1 rounded-sm bg-panel text-muted text-small font-medium border border-border"
            >
              {board}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
