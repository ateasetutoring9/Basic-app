import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo/logo-atease-website.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <Image src={logo} alt="At Ease Learning" width={64} height={64} className="rounded-full" />
        <span className="text-2xl font-bold text-fg">At Ease Learning</span>
      </Link>
      <div className="w-full max-w-sm bg-white border border-border rounded-xl shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}
