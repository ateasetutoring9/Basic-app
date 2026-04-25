// Client-side session helpers. Auth state is stored in a cookie set by
// /api/auth/login. This module reads that cookie and exposes the user info
// so components never need to call supabase.auth.* directly.

export interface SessionUser {
  id: number;
  syncId: string;
  email: string;
  isAdmin: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return {};
  const body = await res.json().catch(() => ({}));
  return { error: body.error ?? "Login failed" };
}

export async function signup(email: string, password: string): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return {};
  const body = await res.json().catch(() => ({}));
  return { error: body.error ?? "Signup failed" };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
