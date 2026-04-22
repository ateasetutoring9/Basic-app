import type { Metadata } from "next";
import Link from "next/link";
import { getSubjects } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { Subject } from "@/lib/content/types";

export const metadata: Metadata = {
  title: "Browse Subjects",
  description: "Choose a subject and year level to start learning — mathematics, science, English, history and more.",
};

// ── Subject catalogue ─────────────────────────────────────────────────────────
// Add a row here whenever a new subject folder lands in /content.
const CATALOGUE: {
  subject: Subject | string;
  label: string;
  description: string;
  accent: string; // Tailwind border + bg classes for the accent strip
}[] = [
  {
    subject: "math",
    label: "Mathematics",
    description: "Algebra, geometry, trigonometry, statistics and more",
    accent: "border-indigo-400 bg-indigo-50",
  },
  {
    subject: "science",
    label: "Science",
    description: "Physics, chemistry, biology and earth sciences",
    accent: "border-emerald-400 bg-emerald-50",
  },
  {
    subject: "english",
    label: "English",
    description: "Reading, writing, literature and language skills",
    accent: "border-amber-400 bg-amber-50",
  },
  {
    subject: "history",
    label: "History",
    description: "Australian and world history across the ages",
    accent: "border-rose-400 bg-rose-50",
  },
];

export default async function BrowsePage() {
  const subjectsWithContent = await getSubjects();
  const countBySubject = Object.fromEntries(
    subjectsWithContent.map(({ subject, yearCounts }) => [
      subject,
      Object.values(yearCounts).reduce((s, n) => s + (n ?? 0), 0),
    ])
  );

  return (
    <PageContainer as="main">
      <h1 className="text-3xl font-bold text-fg mb-2">Browse Subjects</h1>
      <p className="text-muted mb-8">Choose a subject to get started.</p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {CATALOGUE.map(({ subject, label, description, accent }) => {
          const count = countBySubject[subject] ?? 0;
          const available = count > 0;

          return (
            <li key={subject}>
              {available ? (
                <Link
                  href={`/browse/${subject}`}
                  className="group flex flex-col h-full rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 min-h-[100px]"
                >
                  <SubjectCardContent
                    accent={accent}
                    label={label}
                    description={description}
                    count={count}
                  />
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col h-full rounded-xl border border-border bg-white opacity-60 p-6 min-h-[100px] cursor-not-allowed"
                >
                  <SubjectCardContent
                    accent={accent}
                    label={label}
                    description={description}
                    count={0}
                    comingSoon
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}

function SubjectCardContent({
  accent,
  label,
  description,
  count,
  comingSoon,
}: {
  accent: string;
  label: string;
  description: string;
  count: number;
  comingSoon?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`w-1.5 self-stretch rounded-full ${accent.split(" ")[0]} bg-current`} />
        <div className="flex-1">
          <span className="text-lg font-bold text-fg leading-tight">{label}</span>
        </div>
        {comingSoon ? (
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Coming soon
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {count} topic{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </>
  );
}
