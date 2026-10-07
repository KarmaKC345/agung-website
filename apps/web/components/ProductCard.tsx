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
    <article className="group relative flex flex-col border-b border-r border-line bg-surface">
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <ProductImage
          src={product.image}
          name={product.name}
          brand={product.brand}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className={out ? 'opacity-50' : ''}
        />
      </Link>
      <FavoriteButton productId={product.id} name={product.name} className="absolute top-2 right-2 z-10" />

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.colors.length > 0 && (
          <ul className="flex items-center gap-1" aria-label={`Warna: ${product.colors.map((c) => c.label).join(', ')}`}>
            {product.colors.slice(0, 5).map((c) => (
              <li key={c.label} className="size-3 rounded-full ring-1 ring-black/15" style={{ background: c.hex }} title={c.label} />
            ))}
            {extraColors > 0 && <li className="text-[11px] text-muted">+{extraColors}</li>}
          </ul>
        )}
        <h3 className="text-[14px] leading-snug">
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] hover:underline">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            {out ? (
              <p className="text-[13px] font-semibold text-danger">{STOCK_LABEL.habis}</p>
            ) : (
              <>
                {product.priceVaries && <span className="block text-[11px] text-muted">mulai</span>}
                <p className="flex items-baseline gap-1">
                  <Price value={product.price} className="text-[22px]" />
                  <span className="text-[12px] text-muted">/{product.unit}</span>
                </p>
                {product.stockStatus === 'sedikit' && <p className="text-[12px] font-medium text-warn">{STOCK_LABEL.sedikit}</p>}
              </>
            )}
          </div>
          <div className="relative z-10">
            {product.quickAdd ? (
              <QuickAdd product={product} />
            ) : !out ? (
              <Link
                href={href}
                className="tap grid h-9 place-items-center rounded-tag border border-line-strong px-2.5 text-[12px] font-semibold hover:border-ink"
              >
                Pilih
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Grid rapat seperti rak: garis pemisah, tanpa jarak lebar */
export function ProductGrid({ products, priorityCount = 0 }: { products: ProductSummary[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
