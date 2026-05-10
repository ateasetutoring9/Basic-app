"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type State = "loading" | "success" | "already_verified" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>("loading");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    async function verify() {
      // Check if the user has an active session (so we can offer "go to dashboard")
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        setHasSession(meRes.ok);
      } catch {
        setHasSession(false);
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const body = await res.json();

        if (res.ok && body.alreadyVerified) {
          setState("already_verified");
        } else if (res.ok) {
          setState("success");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    }

    verify();
  }, [token, router]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <Loader2 className="w-8 h-8 text-muted animate-spin" />
        <p className="text-small text-muted">Verifying your email…</p>
      </div>
    );
  }

  if (state === "success" || state === "already_verified") {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="w-12 h-12 rounded-full bg-success-soft flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-success" />
        </div>
        <div>
          <h1 className="text-page-title text-fg mb-2">Email verified</h1>
          <p className="text-small text-muted leading-relaxed">
            {state === "already_verified"
              ? "Your email address has already been verified."
              : "You're all set. Your account is now fully verified."}
          </p>
        </div>
        {hasSession ? (
          <Button href="/dashboard" size="lg" className="w-full mt-1">
            Continue to dashboard →
          </Button>
        ) : (
          <Button href="/login" size="lg" className="w-full mt-1">
            Sign in →
          </Button>
        )}
      </div>
    );
  }

  // Error state
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="w-12 h-12 rounded-full bg-error-soft flex items-center justify-center">
        <XCircle className="w-6 h-6 text-error" />
      </div>
      <div>
        <h1 className="text-page-title text-fg mb-2">
          {token ? "Verification link expired" : "Invalid link"}
        </h1>
        <p className="text-small text-muted leading-relaxed">
          {token
            ? "This link is no longer valid. Sign in and we'll send you a new one."
            : "This verification link is missing or invalid. Sign in and we can resend it."}
        </p>
      </div>
      <Button href="/login" size="lg" className="w-full mt-1">
        Sign in
      </Button>
      <p className="text-small text-muted">
        Already verified?{" "}
        <Link href="/dashboard" className="text-accent hover:underline">
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}
