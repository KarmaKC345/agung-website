-- Perbarui teks banner bawaan agar lebih formal dan jelas.
-- Hanya banner yang teksnya belum pernah diubah pemilik yang diperbarui.
update promo_banners b
   set title = v.new_title, subtitle = v.new_subtitle
  from (values
    ('Alat tulis & kantor, lengkap di satu toko', 'Pulpen, kertas, map, kalkulator, sampai tinta printer.',
     'Alat tulis & perlengkapan kantor dalam satu toko', 'Pulpen, kertas, map, kalkulator, hingga tinta printer tersedia di sini.'),
    ('Pesan dari HP, ambil di toko', 'Kirim daftar belanja lewat WhatsApp, barang disiapkan dulu.',
     'Pesan online, ambil di toko', 'Kirim pesanan melalui WhatsApp. Kami siapkan pesanan Anda sebelum Anda datang.'),
    ('Buka setiap hari 05.00-22.00', 'Jl. DR. Ratulangi No.52, Makassar.',
     'Buka setiap hari, 05.00-22.00 WITA', 'Kunjungi kami di Jl. DR. Ratulangi No.52, Makassar.')
  ) as v(old_title, old_subtitle, new_title, new_subtitle)
 where b.title = v.old_title and b.subtitle = v.old_subtitle;
