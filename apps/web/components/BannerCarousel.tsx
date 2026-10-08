'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PromoBanner } from '@newagung/shared';

/** Warna tetap (tidak ikut mode gelap): tulisan putih di atasnya selalu kontras */
const SCRIM: Record<PromoBanner['theme'], { bg: string; fade: string }> = {
  brand: { bg: 'bg-[#282C83]', fade: 'from-[#282C83]/95 via-[#282C83]/70' },
  signal: { bg: 'bg-[#B4161B]', fade: 'from-[#B4161B]/95 via-[#B4161B]/70' },
  ink: { bg: 'bg-[#14162A]', fade: 'from-[#14162A]/90 via-[#14162A]/60' },
};

const INTERVAL = 6000;

/**
 * Banner promo bergeser di atas beranda. Geser dengan jari (scroll-snap) atau tombol;
 * berganti sendiri tiap 6 detik kecuali sedang disentuh/disorot, tab tidak terlihat,
 * atau pengguna memilih kurangi gerak.
 */
export function BannerCarousel({ banners }: { banners: PromoBanner[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const count = banners.length;

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [count]);

  // indeks aktif dari posisi gulir (state hanya berubah saat melewati setengah slide)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (count < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') goTo(index + 1);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [count, index, goTo]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promo dan informasi toko"
      className="group/banner relative"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <div ref={track} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-media)]">
        {banners.map((b, i) => {
          const s = SCRIM[b.theme];
          return (
            <Link
              key={b.id}
              href={b.linkUrl}
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${count}: ${b.title}`}
              className={`relative block aspect-[16/8] w-full shrink-0 snap-start overflow-hidden sm:aspect-[16/6] lg:aspect-[16/5] ${s.bg}`}
            >
              {b.imageUrl && (
                <Image
                  src={b.imageUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1280px) 1248px, 100vw"
                  className="object-cover"
                />
              )}
              <span aria-hidden className={`absolute inset-0 bg-gradient-to-r ${s.fade} to-transparent sm:to-60%`} />
              <span className="absolute inset-y-0 left-0 flex w-[78%] flex-col justify-center gap-2 p-5 text-white sm:w-[60%] sm:p-8 lg:w-1/2 lg:p-12">
                <span className="text-[20px] leading-[1.15] font-extrabold tracking-[-0.02em] text-balance sm:text-[30px] lg:text-[38px]">{b.title}</span>
                {b.subtitle && <span className="line-clamp-2 max-w-[44ch] text-[13px] leading-snug text-white/90 sm:text-[16px]">{b.subtitle}</span>}
                <span className="mt-1 hidden w-fit rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#14162A] sm:inline-block">Lihat sekarang</span>
              </span>
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Banner sebelumnya"
            className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14162A] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)] md:grid md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
          >
            <CaretLeft size={18} weight="bold" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Banner berikutnya"
            className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14162A] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)] md:grid md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
          >
            <CaretRight size={18} weight="bold" aria-hidden />
          </button>
          <div className="absolute bottom-1.5 left-3.5 flex sm:left-6 lg:left-10">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Tampilkan banner ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className="grid h-6 min-w-6 place-items-center px-1"
              >
                <span aria-hidden className={`h-1.5 rounded-full transition-[width,background-color] ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
