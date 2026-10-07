/**
 * Logo New Agung, digambar ulang sebagai SVG dari logo toko (segitiga & lengkung biru,
 * "AGUNG" merah miring, "New" dengan sapuan merah). Ganti dengan file vektor asli bila ada.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="60 0 380 380" className={className} aria-hidden="true">
      <path d="M250 15 L377 212 Q250 196 122 212 Z" fill="#282C83" />
      <path d="M70 362 C110 250 190 226 250 226 C310 226 390 250 425 362 C380 330 320 318 250 318 C180 318 120 330 70 362 Z" fill="#282C83" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 490" className={className} role="img" aria-label="New Agung">
      <path d="M250 15 L377 212 Q250 196 122 212 Z" fill="#282C83" />
      <path d="M70 362 C110 250 190 226 250 226 C310 226 390 250 425 362 C380 330 320 318 250 318 C180 318 120 330 70 362 Z" fill="#282C83" />
      <path d="M342 64 C344 98 376 112 414 88 L532 20 C480 50 430 78 400 86 C374 92 354 84 348 66 Z" fill="#D11D20" />
      <text x="352" y="72" fontFamily="'Brush Script MT', 'Segoe Script', cursive" fontStyle="italic" fontSize="74" fill="currentColor" transform="rotate(-14 400 50)">
        New
      </text>
      <text x="8" y="478" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="700" fontSize="118" fill="#D11D20" textLength="470" lengthAdjust="spacingAndGlyphs">
        AGUNG
      </text>
    </svg>
  );
}
