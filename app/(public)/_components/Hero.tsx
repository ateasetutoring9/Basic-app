import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function Hero() {
  return (
    <section className="py-20 md:py-28 px-4 text-center bg-page">
      <div className="max-w-reading mx-auto">
        <Eyebrow className="mb-5">100% free · No credit card · No ads</Eyebrow>
        <h1 className="text-hero text-fg mb-6">
          Ace your studies.<br />Pay nothing.
        </h1>
        <p className="text-body text-muted mb-10 max-w-xl mx-auto">
          High-quality lectures, auto-graded worksheets, and instant feedback for Year 7–12 Australian students — completely free, forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" size="lg" href="/signup">
            Start learning for free
          </Button>
          <Button variant="secondary" size="lg" href="/browse">
            Browse subjects
          </Button>
        </div>
        <p className="mt-4 text-small text-muted">
          No sign-up required to browse. Create an account to save your progress.
        </p>
      </div>
    </section>
  );
}
