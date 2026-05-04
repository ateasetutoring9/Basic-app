export function SampleQuestion() {
  return (
    <section className="py-16 md:py-24 px-4 bg-white border-y border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">See a question in action</h2>
          <p className="text-lg text-muted">
            A sample from our Year 12 Maths Methods worksheet on differentiation.
          </p>
        </div>
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
                Year 12 · Maths Methods
              </p>
              <p className="text-sm font-medium text-fg">Differentiation — Power Rule</p>
            </div>
            <span className="text-xs text-muted bg-white border border-border rounded px-2 py-1">
              Question 3 of 8
            </span>
          </div>
          <div className="px-6 py-8">
            <p className="font-medium text-fg mb-6">
              Differentiate the function{" "}
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">f(x) = 3x² + 2x − 5</span>{" "}
              with respect to{" "}
              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm">x</span>.
            </p>
            <div className="border border-green-200 bg-green-50 rounded-lg p-5">
              <p className="text-sm font-semibold text-success mb-3">Worked solution</p>
              <div className="space-y-2 text-sm text-muted">
                <p>
                  <span className="font-medium text-fg">Step 1 —</span> Apply the power rule to each term:{" "}
                  <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-green-200">
                    d/dx(axⁿ) = n·axⁿ⁻¹
                  </span>
                </p>
                <p>
                  <span className="font-medium text-fg">Step 2 —</span> Differentiate each term separately:
                </p>
                <ul className="ml-4 space-y-1 list-disc list-inside">
                  <li><span className="font-mono text-xs">d/dx(3x²) = 6x</span></li>
                  <li><span className="font-mono text-xs">d/dx(2x) = 2</span></li>
                  <li><span className="font-mono text-xs">d/dx(−5) = 0</span></li>
                </ul>
                <p>
                  <span className="font-medium text-fg">Step 3 —</span> Combine:{" "}
                  <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-green-200 font-semibold">
                    f′(x) = 6x + 2
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
