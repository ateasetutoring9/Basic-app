import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo/logo-atease-website.png";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="px-4 py-4 bg-page border-b border-border">
      <div className="max-w-page mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="At Ease Learning" width={36} height={36} className="rounded-full" />
          <span className="font-medium text-fg text-base">At Ease Learning</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" href="/login">
            Log in
          </Button>
          <Button variant="primary" size="sm" href="/signup">
            Sign up free
          </Button>
        </nav>
      </div>
    </header>
  );
}
