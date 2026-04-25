"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import LogoutButton from "@/components/LogoutButton";

export function HomeAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    getSession().then(setUser);
  }, []);

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <span className="text-sm text-muted truncate max-w-[200px]">
          {user.email}
        </span>
        <LogoutButton />
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      Log In
    </Link>
  );
}
