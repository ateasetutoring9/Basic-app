"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import LogoutButton from "@/components/LogoutButton";

export function NavAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    getSession().then(setUser);
  }, []);

  if (user) {
    return (
      <>
        <Link
          href="/progress"
          className="min-h-[44px] px-3 flex items-center text-sm font-medium text-muted hover:text-fg transition-colors rounded-lg hover:bg-gray-50"
        >
          My Progress
        </Link>
        <LogoutButton />
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="min-h-[44px] px-3 flex items-center text-sm font-medium text-muted hover:text-fg transition-colors rounded-lg hover:bg-gray-50"
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className="min-h-[44px] px-4 inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        Sign Up
      </Link>
    </>
  );
}
