-- Data awal Toko New Agung.
--
-- store_settings, kategori, merek, dan sinonim pencarian adalah data asli/final.
-- BARANG & HARGA DI BAWAH ADALAH DATA CONTOH untuk pengembangan. Ganti dengan
-- ekspor program kasir lewat Panel → Import sebelum website dibuka untuk umum.

insert into store_settings (id, name, address, lat, lng, maps_url, phone, whatsapp, opening_hours, timezone)
values (
  1,
  'Toko New Agung Alat Tulis & Kantor',
  'Jl. DR. Ratulangi No.52, Kunjung Mae, Kec. Mariso, Kota Makassar, Sulawesi Selatan 90114',
  null, null,  -- isi koordinat dari Google Maps lewat Panel → Info Toko
  'https://www.google.com/maps/search/?api=1&query=Toko+New+Agung+Alat+Tulis+%26+Kantor+Jl.+DR.+Ratulangi+No.52+Makassar',
  '0411850555',
  '6282348485101',
  '{"mon":{"open":"05:00","close":"22:00"},"tue":{"open":"05:00","close":"22:00"},
    "wed":{"open":"05:00","close":"22:00"},"thu":{"open":"05:00","close":"22:00"},
    "fri":{"open":"05:00","close":"22:00"},"sat":{"open":"05:00","close":"22:00"},
    "sun":{"open":"05:00","close":"22:00"}}',
  'Asia/Makassar'
)
on conflict (id) do nothing;

-- Kategori mengikuti papan gantung lorong di toko
with parents(name, slug, sort_order) as (values
  ('Pulpen & Pensil',      'pulpen-pensil',     1),
  ('Spidol & Stabilo',     'spidol-stabilo',    2),
  ('Buku & Album',         'buku-album',        3),
  ('Kertas',               'kertas',            4),
  ('Binder & Map',         'binder-map',        5),
  ('Hekter & Stempel',     'hekter-stempel',    6),
  ('Crayon, Cat & Lem',    'crayon-cat-lem',    7),
  ('Fancy & Kotak Pensil', 'fancy-kotak-pensil', 8),
  ('Kalkulator',           'kalkulator',        9),
  ('Tinta',                'tinta',            10)
)
insert into categories (name, slug, sort_order)
select name, slug, sort_order from parents
on conflict (slug) do nothing;

with children(parent_slug, name, slug, sort_order) as (values
  ('pulpen-pensil',      'Pulpen',              'pulpen',          1),
  ('pulpen-pensil',      'Pensil Mekanik',      'pensil-mekanik',  2),
  ('pulpen-pensil',      'Pensil Kayu',         'pensil-kayu',     3),
  ('pulpen-pensil',      'Koreksi & Penghapus', 'koreksi',         4),
  ('spidol-stabilo',     'Spidol',              'spidol',          1),
  ('spidol-stabilo',     'Stabilo',             'stabilo',         2),
  ('buku-album',         'Buku Tulis',          'buku-tulis',      1),
  ('buku-album',         'Album',               'album',           2),
  ('buku-album',         'Buku Ekspedisi',      'buku-ekspedisi',  3),
  ('binder-map',         'Binder',              'binder',          1),
  ('binder-map',         'Map Seminar',         'map-seminar',     2),
  ('hekter-stempel',     'Hekter',              'hekter',          1),
  ('hekter-stempel',     'Stempel & Numerator', 'stempel',         2),
  ('hekter-stempel',     'Tembak Harga',        'tembak-harga',    3),
  ('crayon-cat-lem',     'Crayon',              'crayon',          1),
  ('crayon-cat-lem',     'Cat Poster',          'cat-poster',      2),
  ('crayon-cat-lem',     'Lem',                 'lem',             3),
  ('fancy-kotak-pensil', 'Kotak Pensil',        'kotak-pensil',    1),
  ('fancy-kotak-pensil', 'Parcel',              'parcel',          2)
)
insert into categories (parent_id, name, slug, sort_order)
select p.id, c.name, c.slug, c.sort_order
from children c join categories p on p.slug = c.parent_slug
on conflict (slug) do nothing;

insert into brands (name, slug) values
  ('Pentel', 'pentel'), ('Standard', 'standard'), ('Snowman', 'snowman'),
  ('Stabilo', 'stabilo'), ('Faber-Castell', 'faber-castell'), ('Joyko', 'joyko'),
  ('Kenko', 'kenko'), ('Casio', 'casio'), ('SiDU', 'sidu'), ('PaperOne', 'paperone'),
  ('Bantex', 'bantex'), ('Titi', 'titi'), ('Fox', 'fox'), ('Artline', 'artline'),
  ('e-Print', 'e-print'), ('Mirage', 'mirage'), ('Max', 'max')
on conflict (slug) do nothing;

insert into search_synonyms (term, synonym) values
  ('tipe-x', 'koreksi'), ('tipex', 'koreksi'), ('tip-ex', 'koreksi'),
  ('stabilo', 'highlighter'),
  ('hvs', 'kertas'), ('a4', 'kertas'),
  ('pulpen', 'bolpoin'), ('pulpen', 'pena'), ('pulpen', 'ballpoint'), ('pulpen', 'gel'),
  ('steples', 'hekter'), ('stapler', 'hekter'), ('staples', 'hekter'),
  ('marker', 'spidol'), ('boardmarker', 'spidol'),
  ('mistar', 'penggaris'), ('lakban', 'selotip'), ('isolasi', 'selotip'),
  ('ink', 'tinta'), ('kalkulator', 'casio'), ('label harga', 'tembak harga')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- BARANG CONTOH
-- ---------------------------------------------------------------------------

create or replace function pg_temp.seed_product(
  cat text, brand text, pname text, pslug text, descr text, variants jsonb
) returns void language plpgsql as $$
declare
  pid uuid;
  vid uuid;
  v jsonb;
  pr jsonb;
  i int := 0;
begin
  insert into products (category_id, brand_id, name, slug, description)
  values (
    (select id from categories where slug = cat),
    (select id from brands where slug = brand),
    pname, pslug, descr
  )
  on conflict (slug) do nothing
  returning id into pid;

  if pid is null then return; end if;

  for v in select * from jsonb_array_elements(variants) loop
    insert into product_variants (product_id, label, color_hex, stock_status, sort_order)
    values (pid, coalesce(v->>'label', ''), v->>'color', coalesce(v->>'stock', 'ada'), i)
    returning id into vid;
    for pr in select * from jsonb_array_elements(v->'prices') loop
      insert into variant_prices (variant_id, unit, qty_per_unit, price)
      values (vid, pr->>'unit', (pr->>'qty')::int, (pr->>'price')::int);
    end loop;
    i := i + 1;
  end loop;
end $$;

select pg_temp.seed_product('pulpen', 'pentel', 'Pentel Energel BLN105 0.5', 'pentel-energel-bln105',
  'Pulpen gel tinta cepat kering, ujung jarum 0.5 mm.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":21000},{"unit":"lusin","qty":12,"price":240000}]},
    {"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":21000},{"unit":"lusin","qty":12,"price":240000}]},
    {"label":"Merah","color":"#C62828","prices":[{"unit":"pcs","qty":1,"price":21000},{"unit":"lusin","qty":12,"price":240000}],"stock":"sedikit"}]');

select pg_temp.seed_product('pulpen', 'standard', 'Standard AE7 Alfa Tip 0.5', 'standard-ae7',
  'Pulpen sehari-hari untuk sekolah dan kantor.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":2500},{"unit":"lusin","qty":12,"price":27000}]},
    {"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":2500},{"unit":"lusin","qty":12,"price":27000}]},
    {"label":"Merah","color":"#C62828","prices":[{"unit":"pcs","qty":1,"price":2500},{"unit":"lusin","qty":12,"price":27000}]}]');

select pg_temp.seed_product('pulpen', 'snowman', 'Snowman V-5 Gel Pen', 'snowman-v5-gel',
  'Pulpen gel 0.5 mm.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":4000},{"unit":"lusin","qty":12,"price":45000}]},
    {"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":4000},{"unit":"lusin","qty":12,"price":45000}]}]');

select pg_temp.seed_product('pensil-mekanik', 'pentel', 'Pentel A255 Pensil Mekanik', 'pentel-a255',
  'Pensil mekanik dengan grip, tersedia ukuran isi 0.5 mm.',
  '[{"label":"0.5 mm","prices":[{"unit":"pcs","qty":1,"price":18000}]}]');

select pg_temp.seed_product('pensil-mekanik', 'pentel', 'Isi Pensil Pentel Hi-Polymer', 'isi-pensil-pentel',
  'Isi pensil mekanik, 40 batang per tabung.',
  '[{"label":"0.5 mm 2B","prices":[{"unit":"tabung","qty":1,"price":12000}]},
    {"label":"0.5 mm HB","prices":[{"unit":"tabung","qty":1,"price":12000}]},
    {"label":"0.7 mm 2B","prices":[{"unit":"tabung","qty":1,"price":12000}],"stock":"habis"}]');

select pg_temp.seed_product('pensil-kayu', 'faber-castell', 'Faber-Castell Pensil 2B', 'faber-castell-pensil-2b',
  'Pensil 2B untuk ujian dan menggambar.',
  '[{"label":"2B","prices":[{"unit":"pcs","qty":1,"price":4000},{"unit":"lusin","qty":12,"price":42000}]}]');

select pg_temp.seed_product('koreksi', 'kenko', 'Kenko Correction Tape CT-526', 'kenko-correction-tape',
  'Pita koreksi (tipe-x kertas), 5 mm × 6 m.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":6500}]}]');

select pg_temp.seed_product('koreksi', 'joyko', 'Joyko Correction Pen CP-02', 'joyko-correction-pen',
  'Tipe-x cair bentuk pena.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":5500}]}]');

select pg_temp.seed_product('spidol', 'snowman', 'Snowman Board Marker BG-12', 'snowman-board-marker',
  'Spidol papan tulis, bisa diisi ulang.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":9500},{"unit":"lusin","qty":12,"price":108000}]},
    {"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":9500},{"unit":"lusin","qty":12,"price":108000}]},
    {"label":"Merah","color":"#C62828","prices":[{"unit":"pcs","qty":1,"price":9500},{"unit":"lusin","qty":12,"price":108000}]}]');

select pg_temp.seed_product('spidol', 'snowman', 'Snowman Permanent Marker', 'snowman-permanent-marker',
  'Spidol permanen untuk kardus, plastik, dan kaca.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":9000}]},
    {"label":"Merah","color":"#C62828","prices":[{"unit":"pcs","qty":1,"price":9000}]}]');

select pg_temp.seed_product('spidol', 'artline', 'Artline 70 Permanent Marker', 'artline-70',
  'Spidol permanen ujung bulat 1.5 mm.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":15000}]}]');

select pg_temp.seed_product('stabilo', 'stabilo', 'Stabilo Boss Original', 'stabilo-boss-original',
  'Highlighter untuk menandai teks.',
  '[{"label":"Kuning","color":"#F5D90A","prices":[{"unit":"pcs","qty":1,"price":13000}]},
    {"label":"Hijau","color":"#3DBE4B","prices":[{"unit":"pcs","qty":1,"price":13000}]},
    {"label":"Oranye","color":"#F28A1B","prices":[{"unit":"pcs","qty":1,"price":13000}]},
    {"label":"Merah Muda","color":"#F06292","prices":[{"unit":"pcs","qty":1,"price":13000}]},
    {"label":"Biru","color":"#29B6F6","prices":[{"unit":"pcs","qty":1,"price":13000}],"stock":"sedikit"}]');

select pg_temp.seed_product('buku-tulis', 'sidu', 'Buku Tulis SiDU', 'buku-tulis-sidu',
  'Buku tulis bergaris, isi per pak 10 buku.',
  '[{"label":"38 lembar","prices":[{"unit":"pcs","qty":1,"price":4000},{"unit":"pak","qty":10,"price":38000}]},
    {"label":"58 lembar","prices":[{"unit":"pcs","qty":1,"price":5500},{"unit":"pak","qty":10,"price":52000}]}]');

select pg_temp.seed_product('album', null, 'Album Foto Magnetik 10R', 'album-foto-magnetik',
  'Album foto halaman magnetik, 20 lembar.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":65000}]}]');

select pg_temp.seed_product('buku-ekspedisi', null, 'Buku Ekspedisi 100 Lembar', 'buku-ekspedisi-100',
  'Buku catatan pengiriman surat/barang.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":14000}]}]');

select pg_temp.seed_product('kertas', 'sidu', 'Kertas HVS SiDU A4 70 gsm', 'kertas-sidu-a4-70',
  'Kertas fotokopi/print A4, 500 lembar per rim.',
  '[{"label":"A4","prices":[{"unit":"rim","qty":1,"price":52000},{"unit":"box","qty":5,"price":255000}]},
    {"label":"F4","prices":[{"unit":"rim","qty":1,"price":58000},{"unit":"box","qty":5,"price":285000}]}]');

select pg_temp.seed_product('kertas', 'paperone', 'Kertas PaperOne A4 80 gsm', 'kertas-paperone-a4-80',
  'Kertas tebal untuk dokumen penting, 500 lembar per rim.',
  '[{"label":"A4","prices":[{"unit":"rim","qty":1,"price":68000},{"unit":"box","qty":5,"price":335000}]}]');

select pg_temp.seed_product('kertas', null, 'Kertas Warna Origami', 'kertas-origami',
  'Kertas lipat warna-warni 16 × 16 cm, 100 lembar.',
  '[{"label":"","prices":[{"unit":"pak","qty":1,"price":8000}]}]');

select pg_temp.seed_product('binder', 'bantex', 'Bantex Ring Binder A4', 'bantex-ring-binder-a4',
  'Ordner/binder 2 ring, punggung 4 cm.',
  '[{"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":42000}]},
    {"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":42000}]}]');

select pg_temp.seed_product('map-seminar', null, 'Map Seminar Resleting', 'map-seminar-resleting',
  'Map kain dengan resleting untuk acara/seminar, bisa sablon.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":12000},{"unit":"lusin","qty":12,"price":132000}]},
    {"label":"Biru Dongker","color":"#1A2557","prices":[{"unit":"pcs","qty":1,"price":12000},{"unit":"lusin","qty":12,"price":132000}]}]');

select pg_temp.seed_product('hekter', 'max', 'Max HD-10 Hekter', 'max-hd10',
  'Stapler kecil untuk isi No.10.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":22000}]}]');

select pg_temp.seed_product('hekter', 'joyko', 'Isi Hekter Joyko No.10', 'isi-hekter-joyko-10',
  'Isi staples No.10, 1.000 biji per kotak kecil.',
  '[{"label":"","prices":[{"unit":"kotak","qty":1,"price":3500},{"unit":"pak","qty":20,"price":65000}]}]');

select pg_temp.seed_product('stempel', 'joyko', 'Bantalan Stempel Joyko', 'bantalan-stempel-joyko',
  'Stamp pad no. 1.',
  '[{"label":"Ungu","color":"#5E35B1","prices":[{"unit":"pcs","qty":1,"price":15000}]},
    {"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"pcs","qty":1,"price":15000}]}]');

select pg_temp.seed_product('stempel', 'kenko', 'Kenko Numerator 6 Digit', 'kenko-numerator',
  'Mesin nomor otomatis 6 digit.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":185000}]}]');

select pg_temp.seed_product('tembak-harga', 'joyko', 'Joyko Price Labeller MX-5500', 'joyko-price-labeller',
  'Alat tembak harga 1 baris.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":95000}]}]');

select pg_temp.seed_product('crayon', 'titi', 'Crayon Titi 12 Warna', 'crayon-titi-12',
  'Crayon minyak untuk anak sekolah.',
  '[{"label":"12 warna","prices":[{"unit":"kotak","qty":1,"price":15000}]},
    {"label":"24 warna","prices":[{"unit":"kotak","qty":1,"price":28000}]}]');

select pg_temp.seed_product('cat-poster', 'joyko', 'Cat Poster Joyko 6 Warna', 'cat-poster-joyko',
  'Cat poster 6 warna × 12 ml.',
  '[{"label":"","prices":[{"unit":"set","qty":1,"price":17000}]}]');

select pg_temp.seed_product('lem', 'fox', 'Lem Fox PVAc', 'lem-fox',
  'Lem putih serbaguna untuk kertas & kayu.',
  '[{"label":"150 g","prices":[{"unit":"pcs","qty":1,"price":11000}]},
    {"label":"1 kg","prices":[{"unit":"pcs","qty":1,"price":42000}]}]');

select pg_temp.seed_product('kotak-pensil', null, 'Kotak Pensil Magnet 2 Sisi', 'kotak-pensil-magnet',
  'Kotak pensil plastik dengan rautan.',
  '[{"label":"Biru","color":"#1F3FAE","prices":[{"unit":"pcs","qty":1,"price":35000}]},
    {"label":"Merah Muda","color":"#F06292","prices":[{"unit":"pcs","qty":1,"price":35000}]}]');

select pg_temp.seed_product('kalkulator', 'casio', 'Casio fx-991ID Plus', 'casio-fx-991id-plus',
  'Kalkulator ilmiah untuk SMA dan kuliah.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":310000}]}]');

select pg_temp.seed_product('kalkulator', 'casio', 'Casio MX-12B', 'casio-mx-12b',
  'Kalkulator meja 12 digit.',
  '[{"label":"","prices":[{"unit":"pcs","qty":1,"price":98000}]}]');

select pg_temp.seed_product('tinta', 'e-print', 'Tinta e-Print untuk Epson 100 ml', 'tinta-eprint-epson',
  'Tinta isi ulang printer Epson seri L.',
  '[{"label":"Hitam","color":"#1B1B1B","prices":[{"unit":"botol","qty":1,"price":25000}]},
    {"label":"Cyan","color":"#00A3D9","prices":[{"unit":"botol","qty":1,"price":25000}]},
    {"label":"Magenta","color":"#D81B7A","prices":[{"unit":"botol","qty":1,"price":25000}]},
    {"label":"Kuning","color":"#F5D90A","prices":[{"unit":"botol","qty":1,"price":25000}]}]');

-- ---------------------------------------------------------------------------
-- PROMO & PILIHAN TOKO CONTOH (butuh migrasi 20261008000000_marketplace)
-- ---------------------------------------------------------------------------

-- harga coret = harga sekarang dinaikkan sekian persen, dibulatkan ke Rp500
update variant_prices vp set original_price = ceil(vp.price * x.factor / 500) * 500
  from (values
    ('stabilo-boss-original', 'pcs', 1.18),
    ('buku-tulis-sidu', 'pak', 1.15),
    ('kertas-sidu-a4-70', 'rim', 1.12),
    ('snowman-board-marker', 'lusin', 1.15),
    ('crayon-titi-12', 'kotak', 1.2),
    ('casio-fx-991id-plus', 'pcs', 1.1)
  ) as x(slug, unit, factor)
  join products p on p.slug = x.slug
  join product_variants v on v.product_id = p.id
 where vp.variant_id = v.id and vp.unit = x.unit;

update products set is_featured = true
 where slug in ('pentel-energel-bln105', 'kertas-paperone-a4-80', 'bantex-ring-binder-a4', 'map-seminar-resleting', 'tinta-eprint-epson', 'faber-castell-pensil-2b');

-- ---------------------------------------------------------------------------
-- FOTO CONTOH (Wikimedia Commons, lisensi bebas; kredit di /kredit-foto)
-- File ada di apps/web/public/produk/. Ganti dengan foto asli lewat panel.
-- ---------------------------------------------------------------------------

insert into product_images (product_id, path, sort_order)
select p.id, '/produk/' || p.slug || '.webp', 0
  from products p
 where p.slug in (
  'artline-70',
  'bantalan-stempel-joyko',
  'bantex-ring-binder-a4',
  'buku-ekspedisi-100',
  'buku-tulis-sidu',
  'casio-fx-991id-plus',
  'casio-mx-12b',
  'cat-poster-joyko',
  'crayon-titi-12',
  'faber-castell-pensil-2b',
  'isi-hekter-joyko-10',
  'isi-pensil-pentel',
  'joyko-correction-pen',
  'kenko-correction-tape',
  'kenko-numerator',
  'kertas-origami',
  'kertas-paperone-a4-80',
  'kertas-sidu-a4-70',
  'kotak-pensil-magnet',
  'lem-fox',
  'map-seminar-resleting',
  'max-hd10',
  'pentel-a255',
  'pentel-energel-bln105',
  'snowman-board-marker',
  'snowman-permanent-marker',
  'snowman-v5-gel',
  'stabilo-boss-original',
  'standard-ae7',
  'tinta-eprint-epson'
 )
   and not exists (select 1 from product_images i where i.product_id = p.id);
