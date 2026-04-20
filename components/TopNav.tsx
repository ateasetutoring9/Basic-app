import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function TopNav() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;
  if (configured) {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-2 h-14">

        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg text-fg hover:text-primary transition-colors shrink-0 min-h-[44px] flex items-center"
        >
          LearnFree
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/browse"
            className="min-h-[44px] px-3 flex items-center text-sm font-medium text-muted hover:text-fg transition-colors rounded-lg hover:bg-gray-50"
          >
            Browse
          </Link>

          {user ? (
            <>
              <Link
                href="/progress"
                className="min-h-[44px] px-3 flex items-center text-sm font-medium text-muted hover:text-fg transition-colors rounded-lg hover:bg-gray-50"
              >
                My Progress
              </Link>
              <LogoutButton />
            </>
          ) : (
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
          )}
        </nav>
      </div>
    </header>
  );
}
