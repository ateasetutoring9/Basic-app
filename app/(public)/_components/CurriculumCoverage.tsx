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
    <section className="py-16 md:py-24 px-4 bg-white border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">Built for Australian students</h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Content is aligned to the Australian Curriculum and mapped to every state and territory&apos;s senior secondary framework.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {boards.map((board) => (
            <span
              key={board}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-800 text-sm font-medium border border-indigo-100"
            >
              {board}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
