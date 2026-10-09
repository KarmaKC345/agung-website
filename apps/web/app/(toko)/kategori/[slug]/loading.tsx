import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

export default function KategoriDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="mb-3 h-5 w-40 rounded bg-sunken animate-pulse" />
      <div className="mb-4 h-7 w-56 rounded bg-sunken animate-pulse" />
      <ProductGridSkeleton count={10} />
    </div>
  );
}
