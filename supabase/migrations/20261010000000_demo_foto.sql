-- Foto contoh untuk produk contoh (seed.sql), supaya staging terlihat seperti toko sungguhan.
-- Hanya produk contoh yang belum punya foto sama sekali; foto yang diunggah lewat panel tidak disentuh.
-- Pada database baru, produk belum ada saat migrasi berjalan, jadi seed.sql yang memasangnya.
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
