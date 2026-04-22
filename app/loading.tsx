export default function Loading() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center space-y-8 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-40 mx-auto" />
        <div className="space-y-2.5">
          <div className="h-5 bg-gray-200 rounded w-full mx-auto" />
          <div className="h-5 bg-gray-200 rounded w-4/5 mx-auto" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <div className="h-[52px] bg-gray-200 rounded-xl w-44 mx-auto sm:mx-0" />
          <div className="h-[52px] bg-gray-200 rounded-xl w-28 mx-auto sm:mx-0" />
        </div>
      </div>
    </main>
  );
}
