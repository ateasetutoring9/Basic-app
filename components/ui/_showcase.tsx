import { Button }        from "./Button";
import { Card }          from "./Card";
import { Input }         from "./Input";
import { PageContainer } from "./PageContainer";

export function Showcase() {
  return (
    <PageContainer as="main">
      <h1 className="text-2xl font-bold text-fg mb-8">Design System Showcase</h1>

      {/* ── Buttons ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-muted mb-4">Button</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary"   size="md">Primary md</Button>
          <Button variant="primary"   size="lg">Primary lg</Button>
          <Button variant="secondary" size="md">Secondary</Button>
          <Button variant="ghost"     size="md">Ghost</Button>
          <Button variant="primary"   size="md" disabled>Disabled</Button>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-muted mb-4">Card</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold text-fg mb-1">Algebra Basics</h3>
            <p className="text-muted text-sm">Year 9 · 12 min read</p>
          </Card>
          <Card>
            <h3 className="font-semibold text-fg mb-1">Quadratic Equations</h3>
            <p className="text-muted text-sm">Year 10 · 18 min read</p>
          </Card>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-muted mb-4">Input</h2>
        <div className="flex flex-col gap-5 max-w-sm">
          <Input
            label="Email address"
            type="email"
            placeholder="you@school.edu"
            helper="We'll never share your email."
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error="Password must be at least 8 characters."
          />
        </div>
      </section>

      {/* ── PageContainer note ── */}
      <section>
        <h2 className="text-lg font-semibold text-muted mb-2">PageContainer</h2>
        <Card className="bg-indigo-50 border-indigo-200">
          <p className="text-sm text-fg">
            This entire page is wrapped in a{" "}
            <code className="font-mono text-primary">PageContainer</code> —
            max-w-3xl, centered, px-4, py-8.
          </p>
        </Card>
      </section>
    </PageContainer>
  );
}
