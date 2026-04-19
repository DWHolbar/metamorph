function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-start gap-4"
          >
            <Bone className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-7 w-16" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Hidden gems heading */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Bone className="h-6 w-32" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
            >
              <div className="flex justify-between">
                <Bone className="h-4 w-24 rounded-full" />
                <Bone className="h-4 w-12" />
              </div>
              <Bone className="h-5 w-36" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Bone className="h-3 w-16" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table placeholder */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Bone className="h-6 w-40" />
          <Bone className="h-5 w-10 rounded-full" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
            <Bone className="h-4 w-48" />
          </div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 dark:border-zinc-800/60"
            >
              <Bone className="h-4 w-32" />
              <Bone className="h-4 w-20 hidden sm:block" />
              <Bone className="h-4 w-10 ml-auto" />
              <Bone className="h-4 w-24 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
