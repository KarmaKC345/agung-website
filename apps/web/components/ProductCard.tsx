import Link from 'next/link';
import { formatRupiah, STOCK_LABEL, type ProductSummary } from '@newagung/shared';
import { FavoriteButton } from './FavoriteButton';
import { Price } from './Price';
import { ProductImage } from './ProductImage';
import { QuickAdd } from './QuickAdd';

/** "Dipesan 1rb+ kali": angka besar dibulatkan seperti di marketplace */
export function soldLabel(n: number): string {
  if (n >= 1000) return `Dipesan ${Math.floor(n / 1000)}rb+ kali`;
  if (n >= 100) return `Dipesan ${Math.floor(n / 100) * 100}+ kali`;
  return `Dipesan ${n} kali`;
}

/** Badge diskon merah di pojok foto */
export function DiscountBadge({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <span className={`price inline-grid place-items-center rounded-[6px] bg-signal px-1.5 py-1 text-[12px] text-white ${className}`}>
      <span className="sr-only">Diskon </span>
      {percent}%
    </span>
  );
}

/**
 * Kartu barang gaya marketplace: foto penuh, badge diskon, nama 2 baris, harga tebal,
 * harga coret + persen, lalu jumlah pesanan. Tombol + hanya untuk barang tanpa pilihan.
 */
export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const href = `/barang/${product.slug}`;
  const out = product.stockStatus === 'habis';
  const promo = product.originalPrice !== null && product.discountPercent !== null && !out;

  return (
    <article className="card card-hover group relative flex h-full flex-col overflow-hidden">
      <div className="relative">
        <ProductImage
          src={product.image}
          name={product.name}
          categorySlug={product.categorySlug}
          sizes="(min-width: 1280px) 210px, (min-width: 1024px) 18vw, (min-width: 640px) 30vw, 50vw"
          priority={priority}
          className={`rounded-none ${out ? 'opacity-45' : ''}`}
        />
        {promo && <DiscountBadge percent={product.discountPercent!} className="absolute top-2 left-2" />}
        {out && (
          <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-ink/80 px-3 py-1 text-[12px] font-semibold text-white">
            {STOCK_LABEL.habis}
          </span>
        )}
        <FavoriteButton productId={product.id} name={product.name} className="absolute top-2 right-2 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-2.5 pb-3 sm:p-3">
        <h3 className="text-[13px] leading-[1.35] sm:text-[14px]">
          <Link href={href} className="line-clamp-2 min-h-[2.7em] after:absolute after:inset-0 after:content-[''] group-hover:text-brand-text">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1">
          {product.priceVaries && <span className="text-[11px] text-muted">Mulai</span>}
          <Price value={product.price} className="text-[16px] sm:text-[17px]" />
          <span className="text-[11px] text-muted">/{product.unit}</span>
        </p>
        {promo && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-none">
            <s className="text-muted tabular-nums">
              <span className="sr-only">Harga normal </span>
              {formatRupiah(product.originalPrice!)}
            </s>
            <span className="font-bold text-signal-text">{product.discountPercent}%</span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="min-w-0 truncate text-[12px] text-muted">
            {product.stockStatus === 'sedikit' ? (
              <span className="font-semibold text-warn">{STOCK_LABEL.sedikit}</span>
            ) : product.sold > 0 ? (
              soldLabel(product.sold)
            ) : (
              product.brand ?? ''
            )}
          </p>
          {product.quickAdd && !out && (
            <div className="relative z-10 -mb-0.5">
              <QuickAdd product={product} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Satu baris barang: di HP digeser ke samping (kartu 152px), di layar lebar 6 kolom.
 */
export function ProductRow({ products, priorityCount = 0 }: { products: ProductSummary[]; priorityCount?: number }) {
  return (
    <div className="scrollbar-none -mx-4 snap-x scroll-px-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="grid w-max auto-cols-[152px] grid-flow-col gap-2.5 sm:auto-cols-[176px] lg:w-full lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-6 lg:gap-3">
        {products.map((p, i) => (
          <li key={p.id} className="h-full snap-start">
            <ProductCard product={p} priority={i < priorityCount} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Grid barang. `wide` = halaman tanpa kolom filter (6 kolom di layar lebar) */
export function ProductGrid({ products, priorityCount = 0, wide = false }: { products: ProductSummary[]; priorityCount?: number; wide?: boolean }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 ${wide ? 'lg:grid-cols-5 xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
