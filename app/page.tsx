import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
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
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-fg">
          LearnFree
        </h1>

        <p className="text-xl text-muted leading-relaxed">
          Free, high-quality education for Year 7–12 students — lectures,
          worksheets, and instant feedback, all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Browse Lectures
          </Link>

          {user ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm text-muted truncate max-w-[200px]">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-xl border-2 border-fg text-fg text-lg font-semibold hover:bg-fg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
