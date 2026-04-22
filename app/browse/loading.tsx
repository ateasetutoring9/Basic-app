import { PageContainer } from "@/components/ui/PageContainer";

export default function Loading() {
  return (
    <PageContainer as="main">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-5 bg-gray-100 rounded w-52 mb-8" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <div className="rounded-xl border border-border bg-white p-6 min-h-[100px] flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-5 bg-gray-100 rounded w-16 shrink-0" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-full" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}
