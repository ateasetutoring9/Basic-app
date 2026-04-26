import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/years", label: "Years" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/topics", label: "Topics" },
  { href: "/admin/worksheets", label: "Worksheets" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value ?? null;
  const session = token ? await verifyToken(token) : null;

  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-1 flex-wrap">
        <span className="text-xs font-bold text-fg uppercase tracking-widest mr-4">Admin</span>
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1.5 text-sm font-medium text-muted hover:text-fg hover:bg-gray-50 rounded-lg transition-colors"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/"
          className="ml-auto text-sm text-muted hover:text-fg transition-colors"
        >
          ← Back to site
        </Link>
      </header>
      {children}
    </div>
  );
}
