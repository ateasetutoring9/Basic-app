import { createServerClient } from "@/lib/supabase/server";
import { parseUserAgent } from "./user-agent";
import type { LoginOutcome } from "@/lib/auth/log-login-attempt";

export type LoginAttemptDisplay = {
  syncId: string;
  attemptedAt: Date;
  outcome: LoginOutcome;
  ipMasked: string;
  device: { os: string; browser: string };
};

function maskIp(ip: string): string {
  const v4parts = ip.split(".");
  if (v4parts.length === 4) return `${v4parts[0]}.${v4parts[1]}.x.x`;
  const v6groups = ip.split(":");
  if (v6groups.length >= 2) return `${v6groups[0]}:${v6groups[1]}:…`;
  return "x.x.x.x";
}

export async function getRecentLoginAttempts(
  userId: number,
  limit = 20
): Promise<LoginAttemptDisplay[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("login_attempts")
      .select("sync_id, attempted_at, outcome, ip_address, user_agent")
      .eq("user_id", userId)
      .neq("outcome", "user_not_found")
      .is("deleted_at", null)
      .order("attempted_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row) => ({
      syncId: row.sync_id,
      attemptedAt: new Date(row.attempted_at),
      outcome: row.outcome as LoginOutcome,
      ipMasked: maskIp(row.ip_address),
      device: parseUserAgent(row.user_agent),
    }));
  } catch {
    return [];
  }
}
