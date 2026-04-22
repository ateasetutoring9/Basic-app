"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/LogoutButton";

export function NavAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const configured =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!configured) return;

    // Lazy import keeps createBrowserClient out of the pre-render critical path
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => setUser(data.user));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    });
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
