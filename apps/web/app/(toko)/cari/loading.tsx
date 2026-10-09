import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

export default function CariLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="mb-4 h-7 w-48 rounded bg-sunken animate-pulse" />
      <ProductGridSkeleton count={10} />
    </div>
  );
}
