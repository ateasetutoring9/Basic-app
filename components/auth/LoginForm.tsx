"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await login(email, password);

    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-page-title text-fg mb-2">Welcome back</h1>
      <p className="text-small text-muted mb-7">Log in to continue your learning.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p role="alert" className="text-small text-error bg-error-soft border border-error rounded-md px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </>
  );
}
