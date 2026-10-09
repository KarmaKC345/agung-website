export function ProductCardSkeleton() {
  return (
    <div className="card flex h-full flex-col overflow-hidden animate-pulse">
      <div className="aspect-square bg-sunken" />
      <div className="flex flex-1 flex-col p-2.5 pb-3 sm:p-3 gap-2">
        <div className="h-4 w-3/4 rounded bg-sunken" />
        <div className="h-4 w-1/2 rounded bg-sunken" />
        <div className="mt-2 h-5 w-24 rounded bg-sunken" />
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-sunken" />
          <div className="size-8 rounded-[10px] bg-sunken" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
