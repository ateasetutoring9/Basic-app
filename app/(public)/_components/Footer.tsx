import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo/logo-atease-website.png";

// TODO: Add real footer links once pages exist (About, Contact, Privacy Policy, Terms of Service)
export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={logo} alt="At Ease Learning" width={32} height={32} className="rounded-full" />
            <span className="font-bold text-fg">At Ease Learning</span>
          </Link>
          <p className="text-sm text-muted max-w-xs text-center md:text-left">
            Free, high-quality education for Year 7–12 Australian students.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3">
          <Link href="/browse" className="text-sm text-muted hover:text-fg transition-colors">
            Browse subjects
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-fg transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="text-sm text-muted hover:text-fg transition-colors">
            Sign up
          </Link>
        </nav>
      </div>
      <p className="mt-10 text-center text-xs text-muted">
        © {new Date().getFullYear()} At Ease Learning. All rights reserved.
      </p>
    </footer>
  );
}
