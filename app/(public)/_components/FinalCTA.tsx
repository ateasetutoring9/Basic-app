import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

// TODO: Replace hardcoded spot count with a live DB count once founding cohort tracking is implemented
export function FinalCTA() {
  return (
    <section className="bg-accent-soft border-y border-border py-20 px-4 text-center" id="cta">
      <div className="max-w-reading mx-auto">
        <Eyebrow className="mb-4 text-accent">247 founding spots remaining</Eyebrow>
        <h2 className="text-section-title text-fg mb-4">
          Start learning for free today
        </h2>
        <p className="text-body text-muted mb-10 max-w-md mx-auto">
          Join Australia&apos;s newest free education platform and help shape what gets built next.
        </p>
        <Button variant="primary" size="lg" href="/signup">
          Create your free account
        </Button>
        <p className="mt-5 text-small text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
