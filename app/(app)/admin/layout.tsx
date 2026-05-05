import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";

export const runtime = 'edge';

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/years", label: "Years" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/topics", label: "Topics" },
  { href: "/admin/worksheets", label: "Worksheets" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value ?? null;
  const session = token ? await verifyToken(token) : null;

  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-52 shrink-0 bg-white border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <span className="text-xs font-bold text-fg uppercase tracking-widest">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-gray-50 rounded-lg transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            href="/browse"
            className="block px-3 py-2 text-sm text-muted hover:text-fg hover:bg-gray-50 rounded-lg transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
