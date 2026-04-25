import Link from "next/link";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { Topic } from "@/lib/content/types";

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
};

export default async function AdminWorksheetsPage() {
  const topics = await getAllTopics();

  const grouped = topics.reduce<Record<string, Record<number, Topic[]>>>((acc, topic) => {
    if (!acc[topic.subject]) acc[topic.subject] = {};
    if (!acc[topic.subject][topic.year]) acc[topic.subject][topic.year] = [];
    acc[topic.subject][topic.year].push(topic);
    return acc;
  }, {});

  return (
    <PageContainer as="main">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
          Dev tool — only works with <code className="font-mono">npm run dev</code>
        </span>
        <h1 className="text-3xl font-bold text-fg">Worksheet Editor</h1>
        <p className="text-muted mt-1">Add, edit, or delete worksheets for any topic.</p>
      </div>

      {Object.entries(grouped).map(([subject, yearMap]) => (
        <section key={subject} className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">
            {SUBJECT_LABELS[subject] ?? subject}
          </h2>

          {(Object.entries(yearMap) as [string, Topic[]][])
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([year, yearTopics]) => (
              <div key={year} className="mb-5">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                  Year {year}
                </h3>
                <ul className="flex flex-col gap-2">
                  {yearTopics.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={`/admin/worksheets/edit?subject=${topic.subject}&year=${topic.year}&slug=${topic.slug}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                      >
                        <span className="font-medium text-fg">{topic.title}</span>
                        {topic.worksheet ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {topic.worksheet.questions.length} question{topic.worksheet.questions.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            No worksheet
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      ))}

      {topics.length === 0 && (
        <p className="text-muted">No topics found in <code className="font-mono text-sm">content/</code>.</p>
      )}
    </PageContainer>
  );
}
