import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo/logo-atease-website.png";

export function Header() {
  return (
    <header className="px-4 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="At Ease Learning" width={36} height={36} className="rounded-full" />
          <span className="font-bold text-fg text-base">At Ease Learning</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted font-medium hover:text-fg transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold text-sm px-4 py-2 hover:bg-primary-hover transition-colors"
          >
            Sign up free
          </Link>
        </nav>
      </div>
    </header>
  );
}
