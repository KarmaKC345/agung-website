const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** 12500 → "Rp12.500" */
export function formatRupiah(value: number): string {
  return `Rp${rupiah.format(Math.round(value))}`;
}

/** "6282348485101" → "0823-4848-5101" ; "0411850555" → "(0411) 850555" */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('62') ? `0${digits.slice(2)}` : digits;
  if (local.startsWith('08')) {
    return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
  }
  if (local.startsWith('0')) {
    return local.replace(/^(0\d{3})(\d+)$/, '($1) $2');
  }
  return local;
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const STOCK_LABEL: Record<'ada' | 'sedikit' | 'habis', string> = {
  ada: 'Stok tersedia',
  sedikit: 'Stok terbatas',
  habis: 'Stok habis',
};

export const ORDER_STATUS_LABEL: Record<'baru' | 'disiapkan' | 'siap' | 'selesai' | 'batal', string> = {
  baru: 'Baru',
  disiapkan: 'Disiapkan',
  siap: 'Siap diambil/dikirim',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
};
