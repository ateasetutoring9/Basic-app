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
        {user.isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin settings"
            className="min-h-[44px] w-10 flex items-center justify-center text-muted hover:text-fg hover:bg-gray-50 transition-colors rounded-lg"
            title="Admin"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
              <path d="m4.22 4.22 1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </Link>
        )}
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
