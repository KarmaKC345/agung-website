import Link from 'next/link';
import { STOCK_LABEL, type ProductSummary } from '@newagung/shared';
import { FavoriteButton } from './FavoriteButton';
import { Price } from './Price';
import { ProductImage } from './ProductImage';
import { QuickAdd } from './QuickAdd';

export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const href = `/barang/${product.slug}`;
  const out = product.stockStatus === 'habis';
  const extraColors = product.colors.length - 5;

  return (
    <article className="card card-hover group relative flex h-full flex-col overflow-hidden">
      <div className="relative p-2 pb-0">
        <ProductImage
          src={product.image}
          name={product.name}
          categorySlug={product.categorySlug}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className={`rounded-[10px] ${out ? 'opacity-50' : ''}`}
        />
        <FavoriteButton productId={product.id} name={product.name} className="absolute top-4 right-4 z-10" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 pt-2.5">
        {product.brand && <p className="text-[12px] font-medium text-muted">{product.brand}</p>}
        <h3 className="text-[14px] leading-snug font-medium">
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        {product.colors.length > 0 && (
          <ul className="mt-0.5 flex items-center gap-1" aria-label={`Warna: ${product.colors.map((c) => c.label).join(', ')}`}>
            {product.colors.slice(0, 5).map((c) => (
              <li key={c.label} className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} title={c.label} />
            ))}
            {extraColors > 0 && <li className="text-[11px] text-muted">+{extraColors}</li>}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {out ? (
              <p className="text-[13px] font-semibold text-danger">{STOCK_LABEL.habis}</p>
            ) : (
              <>
                {product.priceVaries && <span className="block text-[11px] leading-none text-muted">mulai</span>}
                <p className="flex flex-wrap items-baseline gap-x-1">
                  <Price value={product.price} className="text-[17px] sm:text-[19px]" />
                  <span className="text-[12px] text-muted">/{product.unit}</span>
                </p>
                {product.stockStatus === 'sedikit' && <p className="mt-0.5 text-[12px] font-medium text-warn">{STOCK_LABEL.sedikit}</p>}
              </>
            )}
          </div>
          <div className="relative z-10">
            {product.quickAdd ? (
              <QuickAdd product={product} />
            ) : !out ? (
              <Link href={href} className="tap grid h-10 place-items-center rounded-[10px] bg-sunken px-3 text-[13px] font-semibold hover:bg-brand-tint">
                Pilih
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Satu baris barang: di HP digeser ke samping (kartu 168px), di layar lebar 5 kolom.
 */
export function ProductRow({ products }: { products: ProductSummary[] }) {
  return (
    <div className="scrollbar-none -mx-4 snap-x scroll-px-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="grid w-max auto-cols-[168px] grid-flow-col gap-3 lg:w-full lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-5 lg:gap-4">
        {products.map((p) => (
          <div key={p.id} className="h-full snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid barang */
export function ProductGrid({ products, priorityCount = 0 }: { products: ProductSummary[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
