function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-skeleton rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
      aria-hidden
    />
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-8 w-16" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStatCard }
