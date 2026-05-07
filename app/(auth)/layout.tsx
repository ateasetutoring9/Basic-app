import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo/logo-atease-website.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <Image src={logo} alt="At Ease Learning" width={56} height={56} className="rounded-full" />
        <span className="font-display text-xl font-medium text-fg">At Ease Learning</span>
      </Link>
      <div className="w-full max-w-[420px] bg-card border border-border rounded-lg shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}
