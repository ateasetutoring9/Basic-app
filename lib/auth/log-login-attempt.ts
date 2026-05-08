import { createServerClient } from "@/lib/supabase/server";

export type LoginOutcome =
  | "success"
  | "wrong_password"
  | "user_not_found"
  | "account_locked"
  | "email_not_verified"
  | "rate_limited"
  | "error";

type LogLoginAttemptArgs = {
  emailAttempted: string;
  outcome: LoginOutcome;
  userId?: number | null;
  failureDetail?: string | null;
  ipAddress: string;
  userAgent?: string | null;
};

export async function logLoginAttempt(args: LogLoginAttemptArgs): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("login_attempts").insert({
      email_attempted: args.emailAttempted,
      outcome: args.outcome,
      user_id: args.userId ?? null,
      failure_detail: args.failureDetail ?? null,
      ip_address: args.ipAddress,
      user_agent: args.userAgent ? args.userAgent.slice(0, 500) : null,
      attempted_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[logLoginAttempt] failed to write login attempt:", err);
  }
}
