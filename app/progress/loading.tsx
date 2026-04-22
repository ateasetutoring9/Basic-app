import { PageContainer } from "@/components/ui/PageContainer";

export default function Loading() {
  return (
    <PageContainer as="main">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-44 mb-1" />
        <div className="h-5 bg-gray-100 rounded w-64 mb-8" />

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-3 sm:p-5 min-h-[80px] sm:min-h-[96px] gap-2"
            >
              <div className="h-7 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-white p-5 h-[88px]"
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
