import { LogoMark } from '@/components/Logo';

export function CenteredLoading({
  text = 'Memuat…',
  fullscreen = false,
}: {
  text?: string;
  fullscreen?: boolean;
}) {
  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/80 backdrop-blur-xs transition-opacity duration-200'
    : 'flex min-h-[45vh] w-full flex-col items-center justify-center py-16';

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand/15 duration-1000" />
          <LogoMark className="relative h-10 w-10 animate-pulse text-brand" />
        </div>
        <p className="text-[13px] font-medium text-ink-muted animate-pulse">{text}</p>
      </div>
    </div>
  );
}
