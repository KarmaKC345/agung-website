import { formatRupiah } from './format';
import type { Fulfilment } from './types';

export interface WaLine {
  name: string; // nama barang + varian, mis. "Pentel Energel BLN105 0.5 (Biru)"
  unit: string;
  qty: number;
  price: number;
}

export interface WaOrder {
  storeName: string;
  code?: string;
  customerName: string;
  fulfilment: Fulfilment;
  pickupNote?: string;
  lines: WaLine[];
}

export function orderTotal(lines: Pick<WaLine, 'qty' | 'price'>[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

export function buildOrderMessage(order: WaOrder): string {
  const shortName = order.storeName.replace(/\s+Alat Tulis.*$/i, '');
  const items = order.lines
    .map((l, i) => `${i + 1}. ${l.name}: ${l.qty} ${l.unit} × ${formatRupiah(l.price)}`)
    .join('\n');
  const how = order.fulfilment === 'ambil' ? 'Ambil di toko' : 'Minta diantar (ongkir dikonfirmasi toko)';
  const note = order.pickupNote?.trim() ? `, ${order.pickupNote.trim()}` : '';

  return [
    `Halo ${shortName}, saya mau pesan:`,
    '',
    items,
    '',
    `Perkiraan total: ${formatRupiah(orderTotal(order.lines))}`,
    order.code ? `Kode pesanan: ${order.code}` : null,
    '',
    `Nama: ${order.customerName}`,
    `${how}${note}`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export function waLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '62');
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
