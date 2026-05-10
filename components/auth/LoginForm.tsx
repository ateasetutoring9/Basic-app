"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginFormProps {
  resetSuccess?: boolean;
}

export function LoginForm({ resetSuccess }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLocked(false);
    setLoading(true);

    const { error: authError, errorCode } = await login(email, password);

    if (authError) {
      if (errorCode === "account_locked") {
        setLocked(true);
      } else {
        setError(authError);
      }
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

      {resetSuccess && (
        <p role="status" className="text-small text-success bg-success-soft border border-success rounded-md px-4 py-3 mb-5">
          Password updated. You can now log in with your new password.
        </p>
      )}

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

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-small text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {locked && (
          <div role="alert" className="text-small bg-error-soft border border-error rounded-md px-4 py-3 flex flex-col gap-1.5">
            <p className="font-medium text-error">Account temporarily locked</p>
            <p className="text-muted">
              Too many failed sign-in attempts. Wait 30 minutes and try again, or{" "}
              <Link href="/forgot-password" className="text-accent underline hover:no-underline">
                reset your password
              </Link>{" "}
              to regain access immediately.
            </p>
          </div>
        )}

        {error && !locked && (
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
