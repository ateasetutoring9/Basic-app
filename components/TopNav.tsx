import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";

export default function TopNav() {
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

          <NavAuth />
        </nav>
      </div>
    </header>
  );
}
