-- Fitur etalase gaya marketplace: harga coret (promo), barang pilihan toko,
-- banner promo di beranda, dan jumlah pembelian per barang.

-- Harga coret: harga normal sebelum diskon. Kosong = tidak sedang promo.
alter table variant_prices
  add column if not exists original_price int
  check (original_price is null or original_price > price);

-- Barang yang ditonjolkan pemilik di beranda ("Pilihan toko")
alter table products
  add column if not exists is_featured boolean not null default false;

create index if not exists products_featured_idx on products (is_featured) where is_active and is_featured;

-- Banner promo di beranda (dikelola dari panel)
create table if not exists promo_banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text not null default '',
  image_url   text,                                   -- URL foto (unggahan) atau /foto/... bawaan
  link_url    text not null default '/barang',
  theme       text not null default 'brand' check (theme in ('brand', 'signal', 'ink')),
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
alter table promo_banners enable row level security;

-- Banner bawaan berisi info toko yang benar (bukan promo karangan); bisa diubah/dihapus di panel
insert into promo_banners (title, subtitle, image_url, link_url, theme, sort_order)
select * from (values
  ('Alat tulis & kantor, lengkap di satu toko', 'Pulpen, kertas, map, kalkulator, sampai tinta printer.', '/foto/lorong-kertas.webp', '/barang', 'brand', 1),
  ('Pesan dari HP, ambil di toko', 'Kirim daftar belanja lewat WhatsApp, barang disiapkan dulu.', '/foto/papan-lorong.webp', '/kategori', 'ink', 2),
  ('Buka setiap hari 05.00-22.00', 'Jl. DR. Ratulangi No.52, Makassar.', '/foto/etalase-kalkulator.webp', '/tentang', 'signal', 3)
) as v(title, subtitle, image_url, link_url, theme, sort_order)
where not exists (select 1 from promo_banners);

-- Jumlah pembelian per barang: hanya pesanan yang sudah diproses toko
-- (disiapkan/siap/selesai), 180 hari terakhir. Pesanan yang dibuat tapi tidak
-- ditindaklanjuti (status 'baru') atau dibatalkan tidak dihitung.
create or replace view product_sales with (security_invoker = true) as
select v.product_id, count(distinct o.id)::int as orders
  from order_items i
  join orders o on o.id = i.order_id
  join product_variants v on v.id = i.variant_id
 where o.status in ('disiapkan', 'siap', 'selesai')
   and o.created_at > now() - interval '180 days'
 group by v.product_id;

create index if not exists orders_status_created_idx on orders (status, created_at desc);
