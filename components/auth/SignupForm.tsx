"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters (including accented), spaces, hyphens, apostrophes — covers most names
const NAME_RE = /^[\p{L}\s'\-]{2,100}$/u;

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = "Name is required.";
    } else if (!NAME_RE.test(trimmedName)) {
      next.name = "Name can only contain letters, spaces, hyphens, and apostrophes.";
    }
    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const { error: authError } = await signup(email.trim(), password, name.trim());

    if (authError) {
      setSubmitError(authError);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-page-title text-fg mb-2">Create an account</h1>
      <p className="text-small text-muted mb-7">Free forever. No credit card needed.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
          error={errors.name}
          required
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
          helper={errors.password ? undefined : "Minimum 6 characters"}
          error={errors.password}
          required
        />

        {submitError && (
          <p role="alert" className="text-small text-error bg-error-soft border border-error rounded-md px-4 py-3">
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
          {loading ? "Creating account…" : "Sign up free"}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
