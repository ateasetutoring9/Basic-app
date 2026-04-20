import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-bold text-fg hover:text-primary transition-colors"
      >
        LearnFree
      </Link>
      <div className="w-full max-w-sm bg-white border border-border rounded-xl shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}
