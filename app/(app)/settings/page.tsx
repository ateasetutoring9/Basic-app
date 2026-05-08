import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";

export const runtime = "edge";

// TODO: expand with account, notifications, and preferences sections
// as the user model gains more fields.

export default function SettingsPage() {
  return (
    <PageContainer as="main">
      <div className="max-w-2xl">
        <h1 className="text-page-title text-fg mb-8">Settings</h1>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Link
            href="/settings/security"
            className="flex items-center gap-4 px-6 py-4 hover:bg-panel transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-muted flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-small font-medium text-fg">Security</p>
              <p className="text-[0.75rem] text-[var(--text-tertiary)] mt-0.5">
                Recent sign-in activity
              </p>
            </div>
            <span className="ml-auto text-muted text-small" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
