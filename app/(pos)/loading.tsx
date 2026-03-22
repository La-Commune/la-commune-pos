export default function POSLoading() {
  return (
    <div className="pos-page-enter space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-48" />
        <div className="flex gap-3">
          <div className="skeleton h-9 w-28 rounded-lg" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface-0 p-4 space-y-3"
          >
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-7 w-28" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface-0 p-5 space-y-4"
          >
            <div className="skeleton h-5 w-32" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
