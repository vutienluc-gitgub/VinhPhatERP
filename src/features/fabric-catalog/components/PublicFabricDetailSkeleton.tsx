export function PublicFabricDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-surface shadow-sm sticky top-0 z-30 px-4 py-3 text-center">
        <div className="h-6 bg-surface-secondary rounded w-1/2 mx-auto"></div>
      </header>

      {/* Hero Image Skeleton */}
      <div className="w-full aspect-[4/3] bg-surface-secondary"></div>

      <main className="flex-1 p-3 space-y-3">
        {/* Basic Info Skeleton */}
        <div className="bg-surface rounded-xl shadow-sm p-4">
          <div className="h-8 bg-surface-secondary rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-surface-secondary rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-surface-secondary rounded w-1/2"></div>
        </div>

        {/* Color Chips Skeleton */}
        <div className="bg-surface rounded-xl shadow-sm p-4">
          <div className="h-5 bg-surface-secondary rounded w-1/4 mb-4"></div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-surface-secondary"
              ></div>
            ))}
          </div>
        </div>

        {/* Specs Skeleton */}
        <div className="bg-surface rounded-xl shadow-sm p-4">
          <div className="h-5 bg-surface-secondary rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-surface-secondary rounded w-1/2"></div>
                <div className="h-4 bg-surface-secondary rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
