'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PromoBanner } from '@newagung/shared';

/** Warna tetap (tidak ikut mode gelap): tulisan putih di atasnya selalu kontras */
const SCRIM: Record<PromoBanner['theme'], { bg: string; fade: string }> = {
  brand: { bg: 'bg-[#282C83]', fade: 'from-[#282C83]/90 via-[#282C83]/45 sm:via-[#282C83]/65' },
  signal: { bg: 'bg-[#B4161B]', fade: 'from-[#B4161B]/90 via-[#B4161B]/45 sm:via-[#B4161B]/65' },
  ink: { bg: 'bg-[#14162A]', fade: 'from-[#14162A]/85 via-[#14162A]/40 sm:via-[#14162A]/60' },
};

const INTERVAL = 5000;

/**
 * Banner promo yang berputar otomatis tanpa henti (5 detik per banner). Setelah banner
 * terakhir, putaran lanjut ke banner pertama dengan arah yang sama: banner pertama disalin
 * di ujung, dan begitu salinan itu tampil posisi dikembalikan diam-diam ke banner asli.
 * Bisa digeser dengan jari (scroll-snap), tombol panah (layar lebar), atau titik.
 * Putaran berhenti sementara hanya saat disentuh, disorot mouse, atau difokus keyboard.
 */
export function BannerCarousel({ banners }: { banners: PromoBanner[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const count = banners.length;
  const loop = count > 1;
  const slides = loop ? [...banners, banners[0]!] : banners;

  const behavior = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  /** posisi slide saat ini (0..count, count = salinan banner pertama) */
  const position = useCallback(() => {
    const el = track.current;
    return el ? Math.round(el.scrollLeft / el.clientWidth) : 0;
  }, []);

  const scrollToSlide = useCallback((i: number, how: ScrollBehavior) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: how });
  }, []);

  const next = useCallback(() => {
    scrollToSlide(position() + 1, behavior());
  }, [position, scrollToSlide]);

  const prev = useCallback(() => {
    const p = position();
    if (p === 0 && loop) {
      // lompat diam-diam ke salinan di ujung, lalu geser mundur ke banner terakhir
      scrollToSlide(count, 'auto');
      requestAnimationFrame(() => scrollToSlide(count - 1, behavior()));
    } else scrollToSlide(p - 1, behavior());
  }, [count, loop, position, scrollToSlide]);

  // indeks titik aktif + kembali ke banner asli setelah salinan tampil
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const p = position();
      setIndex(p % count);
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (loop && position() === count) el.scrollTo({ left: 0, behavior: 'auto' });
      }, 120);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(settle);
    };
  }, [count, loop, position]);

  useEffect(() => {
    if (!loop) return;
    const t = setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') next();
    }, INTERVAL);
    return () => clearInterval(t);
  }, [loop, next]);

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promo dan informasi toko"
      className="group/banner relative"
      onPointerEnter={(e) => e.pointerType === 'mouse' && pause()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && resume()}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div ref={track} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-media)]">
        {slides.map((b, i) => {
          const s = SCRIM[b.theme];
          const clone = i === count;
          return (
            <Link
              key={clone ? `${b.id}-salinan` : b.id}
              href={b.linkUrl}
              aria-roledescription="slide"
              aria-label={`${(i % count) + 1} dari ${count}: ${b.title}`}
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
              className={`relative block aspect-[16/8] w-full shrink-0 snap-start overflow-hidden sm:aspect-[16/6] lg:aspect-[16/5] ${s.bg}`}
            >
              {b.imageUrl && (
                <Image src={b.imageUrl} alt="" fill priority={i === 0} sizes="(min-width: 1280px) 1248px, 100vw" className="object-cover" />
              )}
              <span aria-hidden className={`absolute inset-0 bg-gradient-to-r ${s.fade} to-transparent to-75% sm:to-60%`} />
              <span className="absolute inset-y-0 left-0 flex w-[60%] flex-col justify-center gap-1 p-4 pb-7 text-white sm:w-[55%] sm:gap-2 sm:p-8 lg:w-1/2 lg:p-12">
                <span className="text-[15px] leading-[1.2] font-bold tracking-[-0.01em] text-balance sm:text-[26px] sm:font-extrabold lg:text-[34px]">
                  {b.title}
                </span>
                {b.subtitle && (
                  <span className="line-clamp-1 max-w-[44ch] text-[12px] leading-snug text-white/90 sm:line-clamp-2 sm:text-[15px]">{b.subtitle}</span>
                )}
                <span className="mt-1 hidden w-fit rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#14162A] sm:inline-block">Lihat sekarang</span>
              </span>
            </Link>
          );
        })}
      </div>

      {loop && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Banner sebelumnya"
            className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14162A] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)] md:grid md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
          >
            <CaretLeft size={18} weight="bold" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Banner berikutnya"
            className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14162A] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)] md:grid md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
          >
            <CaretRight size={18} weight="bold" aria-hidden />
          </button>
          <div className="absolute bottom-1 left-2.5 flex sm:bottom-1.5 sm:left-6 lg:left-10">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => scrollToSlide(i, behavior())}
                aria-label={`Tampilkan banner ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className="grid h-6 min-w-6 place-items-center px-1"
              >
                <span aria-hidden className={`h-1.5 rounded-full transition-[width,background-color] ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
