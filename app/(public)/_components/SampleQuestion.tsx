import { Eyebrow } from "@/components/ui/Eyebrow";

export function SampleQuestion() {
  return (
    <section className="py-16 md:py-24 px-4 bg-card border-y border-border">
      <div className="max-w-reading mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-section-title text-fg mb-4">See a question in action</h2>
          <p className="text-body text-muted">
            A sample from our Year 12 Maths Methods worksheet on differentiation.
          </p>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-panel">
            <div>
              <Eyebrow className="mb-0.5">Year 12 · Maths Methods</Eyebrow>
              <p className="text-small font-medium text-fg">Differentiation — Power Rule</p>
            </div>
            <span className="text-small text-muted bg-card border border-border rounded-sm px-2 py-1">
              Question 3 of 8
            </span>
          </div>
          <div className="bg-card px-6 py-8">
            <p className="text-body font-medium text-fg mb-6">
              Differentiate the function{" "}
              <code className="font-mono bg-panel px-2 py-0.5 rounded-sm text-small">f(x) = 3x² + 2x − 5</code>{" "}
              with respect to{" "}
              <code className="font-mono bg-panel px-1 py-0.5 rounded-sm text-small">x</code>.
            </p>
            <div className="bg-success-soft border border-border rounded-md p-5">
              <p className="text-small font-semibold text-success mb-3">Worked solution</p>
              <div className="space-y-2 text-small text-muted">
                <p>
                  <span className="font-medium text-fg">Step 1 —</span> Apply the power rule to each term:{" "}
                  <code className="font-mono text-xs bg-card px-1.5 py-0.5 rounded-sm border border-border">
                    d/dx(axⁿ) = n·axⁿ⁻¹
                  </code>
                </p>
                <p>
                  <span className="font-medium text-fg">Step 2 —</span> Differentiate each term separately:
                </p>
                <ul className="ml-4 space-y-1 list-disc list-inside">
                  <li><code className="font-mono text-xs">d/dx(3x²) = 6x</code></li>
                  <li><code className="font-mono text-xs">d/dx(2x) = 2</code></li>
                  <li><code className="font-mono text-xs">d/dx(−5) = 0</code></li>
                </ul>
                <p>
                  <span className="font-medium text-fg">Step 3 —</span> Combine:{" "}
                  <code className="font-mono text-xs bg-card px-1.5 py-0.5 rounded-sm border border-border font-semibold">
                    f′(x) = 6x + 2
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
