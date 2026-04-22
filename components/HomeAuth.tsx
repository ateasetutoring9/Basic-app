"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/LogoutButton";

export function HomeAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const configured =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!configured) return;

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
