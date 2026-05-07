import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export function BreadcrumbNav({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm text-muted">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="text-muted/50">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-fg transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-fg font-medium" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
