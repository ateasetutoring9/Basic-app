"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";

type ResendState = "idle" | "sending" | "sent" | "cooldown" | "error";

function ResendButton() {
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

    // Reset after 5 seconds
    setTimeout(() => setResendState("idle"), 5000);
  }

  const label: Record<ResendState, string> = {
    idle: "Resend email",
    sending: "Sending…",
    sent: "Email sent — check your inbox",
    cooldown: "Please wait a few minutes",
    error: "Couldn't send — try again",
  };

  return (
    <button
      onClick={handleResend}
      disabled={resendState !== "idle"}
      className="text-small font-medium text-accent underline hover:no-underline disabled:opacity-60 disabled:no-underline whitespace-nowrap"
    >
      {label[resendState]}
    </button>
  );
}

interface EmailVerificationBannerProps {
  isVerified: boolean;
}

export function EmailVerificationBanner({ isVerified }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (isVerified || dismissed) return null;

  return (
    <div className="w-full bg-accent-soft border-b border-border px-4 py-2.5">
      <div className="max-w-page mx-auto flex items-center gap-3">
        <MailCheck className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
        <p className="text-small text-fg flex-1 min-w-0">
          Verify your email so we can keep your account secure. Check your inbox for the verification link.
        </p>
        <div className="flex items-center gap-4 flex-shrink-0">
          <ResendButton />
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-muted hover:text-fg transition-colors text-base leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
