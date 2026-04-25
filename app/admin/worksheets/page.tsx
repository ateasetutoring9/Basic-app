import Link from "next/link";
import { getAllTopics } from "@/lib/content/loader";
import { PageContainer } from "@/components/ui/PageContainer";
import type { Topic } from "@/lib/content/types";

export default async function AdminWorksheetsPage() {
  const topics = await getAllTopics();

  // Group by subject name → year displayName
  const grouped = topics.reduce<Record<string, Record<string, Topic[]>>>((acc, topic) => {
    const subjectName = topic.subject.name;
    const yearDisplay = topic.subject.year.displayName;
    if (!acc[subjectName]) acc[subjectName] = {};
    if (!acc[subjectName][yearDisplay]) acc[subjectName][yearDisplay] = [];
    acc[subjectName][yearDisplay].push(topic);
    return acc;
  }, {});

  return (
    <PageContainer as="main">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-fg">Worksheet Editor</h1>
        <p className="text-muted mt-1">Add, edit, or delete worksheets for any topic.</p>
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([subjectName, yearMap]) => (
          <section key={subjectName} className="mb-10">
            <h2 className="text-xl font-bold text-fg mb-4">{subjectName}</h2>

            {Object.entries(yearMap)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([yearDisplay, yearTopics]) => (
                <div key={yearDisplay} className="mb-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                    {yearDisplay}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {yearTopics.map((topic) => (
                      <li key={topic.syncId}>
                        <Link
                          href={`/admin/worksheets/edit?syncId=${topic.syncId}`}
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
        <p className="text-muted">No topics found.</p>
      )}
    </PageContainer>
  );
}
