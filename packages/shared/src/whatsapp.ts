import { formatRupiah } from './format';
import type { Fulfilment, PaymentMethod } from './types';

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
  paymentMethod?: PaymentMethod;
  shippingCourier?: string;
  shippingService?: string;
  shippingCost?: number;
  deliveryAddress?: string;
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
  const itemsTotal = orderTotal(order.lines);
  const shipping = order.fulfilment === 'antar' ? (order.shippingCost ?? 0) : 0;
  const finalTotal = itemsTotal + shipping;

  const how =
    order.fulfilment === 'ambil'
      ? 'Ambil di toko'
      : shipping > 0 && order.shippingCourier
        ? `Diantar (${[order.shippingCourier, order.shippingService].filter(Boolean).join(' ')})`
        : 'Diantar (ongkos kirim mohon dikonfirmasi)';
  const note = order.pickupNote?.trim() ? `, ${order.pickupNote.trim()}` : '';

  const courierLabel = [order.shippingCourier, order.shippingService].filter(Boolean).join(' ');

  return [
    `Halo ${shortName}, saya ingin memesan:`,
    '',
    items,
    '',
    shipping > 0 ? `Subtotal produk: ${formatRupiah(itemsTotal)}` : null,
    shipping > 0 ? `Ongkir (${courierLabel || 'Kurir'}): ${formatRupiah(shipping)}` : null,
    `Total: ${formatRupiah(finalTotal)}`,
    order.code ? `Kode pesanan: ${order.code}` : null,
    '',
    `Nama: ${order.customerName}`,
    `Cara terima: ${how}${note}`,
    order.fulfilment === 'antar' && order.deliveryAddress ? `Alamat: ${order.deliveryAddress}` : null,
    order.paymentMethod === 'dana' ? 'Pembayaran: DANA (Lunas)' : null,
    '',
    'Terima kasih.',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export function waLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '62');
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
