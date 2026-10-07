import { describe, expect, it } from 'vitest';
import { buildOrderMessage, formatPhone, formatRupiah, getOpenStatus, slugify, summarizeHours, waLink } from './index';

const everyDay = { open: '05:00', close: '22:00' };
const hours = { mon: everyDay, tue: everyDay, wed: everyDay, thu: everyDay, fri: everyDay, sat: everyDay, sun: everyDay };

describe('format', () => {
  it('formats rupiah', () => {
    expect(formatRupiah(12500)).toBe('Rp12.500');
    expect(formatRupiah(250000)).toBe('Rp250.000');
  });
  it('formats phones', () => {
    expect(formatPhone('6282348485101')).toBe('0823-4848-5101');
    expect(formatPhone('0411850555')).toBe('(0411) 850555');
  });
  it('slugifies', () => {
    expect(slugify('Pentel Energel BLN105 0.5')).toBe('pentel-energel-bln105-0-5');
  });
});

describe('opening hours (WITA)', () => {
  // 2026-10-07 is a Wednesday. WITA = UTC+8.
  it('is open during the day', () => {
    const s = getOpenStatus(hours, 'Asia/Makassar', new Date('2026-10-07T02:00:00Z')); // 10.00 WITA
    expect(s).toEqual({ isOpen: true, label: 'Buka · tutup 22.00' });
  });
  it('is closed after 22.00 and reopens at 05.00', () => {
    const s = getOpenStatus(hours, 'Asia/Makassar', new Date('2026-10-07T14:30:00Z')); // 22.30 WITA
    expect(s).toEqual({ isOpen: false, label: 'Tutup · buka 05.00' });
  });
  it('is closed before 05.00', () => {
    const s = getOpenStatus(hours, 'Asia/Makassar', new Date('2026-10-06T20:00:00Z')); // 04.00 WITA
    expect(s).toEqual({ isOpen: false, label: 'Tutup · buka 05.00' });
  });
  it('summarizes uniform hours', () => {
    expect(summarizeHours(hours)).toBe('Setiap hari, 05.00–22.00');
  });
});

describe('whatsapp', () => {
  it('builds the order message', () => {
    const msg = buildOrderMessage({
      storeName: 'Toko New Agung Alat Tulis & Kantor',
      code: 'NA-261007-014',
      customerName: 'Rina',
      fulfilment: 'ambil',
      pickupNote: 'jam 16.00',
      lines: [
        { name: 'Kertas HVS SiDU A4 70 gsm (A4)', unit: 'rim', qty: 2, price: 52000 },
        { name: 'Buku Tulis SiDU (58 lembar)', unit: 'pcs', qty: 10, price: 5500 },
      ],
    });
    expect(msg).toBe(
      [
        'Halo Toko New Agung, saya mau pesan:',
        '',
        '1. Kertas HVS SiDU A4 70 gsm (A4) — 2 rim × Rp52.000',
        '2. Buku Tulis SiDU (58 lembar) — 10 pcs × Rp5.500',
        '',
        'Perkiraan total: Rp159.000',
        'Kode pesanan: NA-261007-014',
        '',
        'Nama: Rina',
        'Ambil di toko, jam 16.00',
      ].join('\n'),
    );
  });
  it('builds wa.me links', () => {
    expect(waLink('6282348485101')).toBe('https://wa.me/6282348485101');
    expect(waLink('082348485101', 'a b')).toBe('https://wa.me/6282348485101?text=a%20b');
  });
});
