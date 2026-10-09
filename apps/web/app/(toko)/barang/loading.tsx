import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

export default function BarangLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="mb-3 h-5 w-32 rounded bg-sunken animate-pulse" />
      <div className="mt-4 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="card space-y-4 p-4 animate-pulse">
            <div className="h-5 w-24 rounded bg-sunken" />
            <div className="h-8 rounded bg-sunken" />
            <div className="h-8 rounded bg-sunken" />
            <div className="h-8 rounded bg-sunken" />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-4 h-7 w-48 rounded bg-sunken animate-pulse" />
          <ProductGridSkeleton count={10} />
        </div>
      </div>
    </div>
  );
}
