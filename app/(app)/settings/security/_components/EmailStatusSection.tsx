"use client";

import { useState } from "react";

type ResendState = "idle" | "sending" | "sent" | "cooldown" | "error";

interface EmailStatusSectionProps {
  email: string;
  isVerified: boolean;
}

export function EmailStatusSection({ email, isVerified }: EmailStatusSectionProps) {
  const [resendState, setResendState] = useState<ResendState>("idle");

  async function handleResend() {
    if (resendState !== "idle") return;
    setResendState("sending");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 429) {
        setResendState("cooldown");
      } else if (res.ok) {
        setResendState("sent");
      } else {
        setResendState("error");
      }
    } catch {
      setResendState("error");
    }

    setTimeout(() => setResendState("idle"), 5000);
  }

  const resendLabel: Record<ResendState, string> = {
    idle: "Resend verification email",
    sending: "Sending…",
    sent: "Email sent — check your inbox",
    cooldown: "Please wait a few minutes",
    error: "Couldn't send — try again",
  };

  return (
    <section className="mb-8">
      <h2 className="text-subsection-title text-fg mb-3">Email address</h2>
      <div className="rounded-lg border border-border bg-card px-5 py-4 flex flex-wrap items-center gap-3">
        <p className="text-small text-fg flex-1 min-w-0 truncate">{email}</p>
        {isVerified ? (
          <span className="text-[0.75rem] font-medium px-2 py-0.5 rounded-full bg-success-soft text-success">
            Verified
          </span>
        ) : (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[0.75rem] font-medium px-2 py-0.5 rounded-full bg-error-soft text-error">
              Not verified
            </span>
            <button
              onClick={handleResend}
              disabled={resendState !== "idle"}
              className="text-small text-accent underline hover:no-underline disabled:opacity-60 disabled:no-underline"
            >
              {resendLabel[resendState]}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
