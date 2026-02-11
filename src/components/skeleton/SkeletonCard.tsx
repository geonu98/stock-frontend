export function SkeletonEditorPickCard() {
  return (
    <div className="min-w-[260px] rounded-3xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-14 rounded bg-gray-200" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="h-3 w-10 rounded bg-gray-200" />
        <div className="h-6 w-24 rounded bg-gray-200" />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="h-[46px] w-[150px] rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonHScroll({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonEditorPickCard key={i} />
      ))}
    </>
  );
}
