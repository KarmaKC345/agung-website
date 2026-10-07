# PRD — Website Toko New Agung Alat Tulis & Kantor

| | |
|---|---|
| Status | Draft v3 — perencanaan |
| Tanggal | 7 Oktober 2026 |
| Stack | Next.js (frontend) · Express (API) · Supabase/Postgres (database, storage, auth) |
| Sumber | Peta fitur "Toko New Agung" (Fase 1–4) + profil Google Maps toko |

> Data toko di dokumen ini sudah dikonfirmasi pemilik (lihat §11), kecuali data barang
> yang menyusul.

---

## 1. Profil toko

| | |
|---|---|
| Nama | Toko New Agung Alat Tulis & Kantor |
| Jenis | Toko alat tulis (ATK) & perlengkapan kantor |
| Alamat | Jl. DR. Ratulangi No.52, Kunjung Mae, Kec. Mariso, Kota Makassar, Sulawesi Selatan 90114 (area Mamajang) |
| Telepon | (0411) 850555 |
| WhatsApp pesanan | **0823-4848-5101** → `https://wa.me/6282348485101`. (Nomor 0859-2359-8052 di spanduk depan milik *Printech*, **bukan** nomor pesanan toko.) |
| Jam buka | **Setiap hari 05.00–22.00 WITA, tanpa hari libur** (dari pemilik; data Google Maps "tutup 21.30" perlu diperbarui di profil Google) |
| Domain | `newagung.com` (sementara) |
| Logo | Segitiga biru bertingkat, tulisan "AGUNG" merah miring, "New" abu tua dengan sapuan merah |
| Zona waktu | WITA (`Asia/Makassar`) |
| Reputasi Google | 4,5 ★ dari ±10.466 ulasan |
| Merek yang terlihat di rak | Casio, Pentel, Kenko, Artline, Snowman, Mirage, e-Print (tinta), dan lainnya |
| Format toko | Swalayan ATK: pelanggan mengambil sendiri dengan keranjang/troli, lorong diberi papan nama gantung per jenis barang, barang kecil (pulpen, pensil mekanik, isi staples) dilayani di etalase kaca. Ada aturan di rak: *"membuka pembungkus/segel berarti membeli"*. |

Angka 10 ribu ulasan menunjukkan toko ini sudah sangat dikenal di Makassar. Website
tidak perlu "meyakinkan" orang dengan bahasa iklan. Cukup buat pelanggan lama lebih
mudah mengecek barang dan memesan.

## 2. Latar belakang

Pelanggan toko ATK punya pola yang khas:

- **Orang tua & pelajar** membawa *daftar kebutuhan sekolah*, terutama di awal tahun
  ajaran (Juli) dan awal semester (Januari). Antrean di toko memanjang.
- **Kantor, sekolah, dan usaha** membeli rutin dalam jumlah besar (kertas per rim,
  pulpen per lusin/box, map, tinta) dan sering menanyakan harga partai lewat chat.
- **Pembeli eceran** menanyakan hal kecil: *"ada pulpen Pentel warna biru?"*,
  *"kertas A4 70 gram berapa per rim?"*, *"buka sampai jam berapa?"*.

Semua pertanyaan itu saat ini dijawab manual lewat telepon/WA. Website ini **bukan
marketplace** dan tidak memproses pembayaran. Tujuannya: pelanggan bisa melihat barang,
varian, dan harga kapan saja, lalu memesan lewat WhatsApp dengan pesan yang sudah rapi,
dan barang bisa disiapkan sebelum pelanggan datang.

## 3. Tujuan & ukuran keberhasilan

| Tujuan | Ukuran (3 bulan setelah Fase 2 live) |
|---|---|
| Pelanggan menemukan barang tanpa bertanya | ≥ 60% pencarian berakhir di halaman detail barang |
| Chat WA lebih rapi | ≥ 50% chat pesanan masuk lewat tombol "Pesan" (format terisi otomatis) |
| Antrean musim sekolah berkurang | Ada pesanan "siapkan dulu, ambil di toko" yang tercatat di panel |
| Harga di web selalu benar | Pemilik bisa ubah harga dalam < 30 detik dari HP |
| Cepat di HP murah & sinyal lemah | LCP < 2,5 dtk di 4G lambat, halaman katalog < 200 KB JS |

**Bukan tujuan (out of scope v1):** pembayaran online, ongkir otomatis, akun pelanggan
dengan password, integrasi kasir/POS, aplikasi mobile native, layanan printing/Printech
(lihat 4.9).

## 4. Pengguna

**Pelanggan eceran & orang tua murid (mayoritas di HP).** Datang dari Google Maps, WA,
atau grup kelas. Mau cepat: cari barang, lihat harga & warna, pesan. Tidak mau daftar akun.

**Pembeli kantor/instansi.** Pesan dalam jumlah besar, peduli harga grosir, sering
mengulang pesanan yang sama tiap bulan.

**Pemilik toko.** Mengurus ribuan barang kecil dengan banyak varian. Butuh panel yang
bisa dipakai di HP di sela melayani pembeli.

**Pegawai.** Input barang, foto barang, dan menyiapkan pesanan masuk. Tidak punya akses
ke pengaturan toko atau hapus data.

## 5. Ruang lingkup per fase

Urutan mengikuti peta fitur. Catatan: katalog (Fase 1) butuh data barang, sedangkan
panel "Kelola Barang" baru ada di Fase 3. Data awal diisi lewat **import Excel/CSV**
di Fase 0. Toko ATK biasanya sudah punya daftar barang dari program kasir, dan file
ekspornya bisa langsung dipakai.

### Fase 1 — Katalog, Pencarian, Kategori

#### 5.1 Katalog Barang
| Sub fitur | Kebutuhan |
|---|---|
| Daftar barang & harga | Grid barang: foto, nama, merek, harga, satuan (pcs/lusin/pak/rim/box). Format `Rp3.500`. Barang kosong ditandai "Stok habis", tidak disembunyikan. |
| Foto barang | 1–5 foto per barang, WebP/AVIF lewat `next/image`. Tanpa foto → placeholder berupa nama merek + jenis barang, bukan ilustrasi stok. |
| Rincian barang | `/barang/[slug]`: foto, harga, satuan, merek, **pilihan varian**, deskripsi singkat, tombol pesan. |
| Varian *(wajib untuk ATK)* | Satu barang punya varian warna/ukuran/tipe (pulpen hitam/biru/merah, buku 38/58 lembar, kertas 70/80 gram). Harga & stok bisa berbeda per varian. Varian warna ditampilkan sebagai titik warna. |
| Harga satuan & grosir | Harga bertingkat per satuan: "Rp3.500/pcs · Rp38.000/lusin", "Rp52.000/rim · Rp250.000/box (5 rim)". |

#### 5.2 Pencarian Barang
| Sub fitur | Kebutuhan |
|---|---|
| Kotak pencarian | Selalu terlihat di header (sticky di HP). |
| Saran kata kunci | Muncul setelah 2 huruf, debounce 200 ms, maksimal 6 saran, termasuk merek. |
| Hasil pencarian | Toleran salah ketik dan istilah lokal: "tipe-x" ≈ "correction pen/tape", "stabilo" ≈ "highlighter", "HVS" ≈ "kertas A4", "pulpen" ≈ "bolpoin". Pakai Postgres full-text + `pg_trgm` + tabel sinonim. |
| Pencarian kosong | Tombol "Tanya stok via WhatsApp" dengan kata kunci terisi. Kata kunci yang tidak ketemu dicatat jadi masukan untuk pemilik (barang apa yang dicari tapi belum ada di web). |

#### 5.3 Kategori Barang
| Sub fitur | Kebutuhan |
|---|---|
| Daftar kategori | Maksimal 2 tingkat. Kategori **mengikuti papan gantung lorong di toko**, supaya pelanggan yang biasa datang langsung mengenalinya. Dari foto: Buku · Album · Ekspedisi · Binder · Fancy · Map Seminar · Crayon · Tembak Harga (label harga) · Stempel · Numerator · Pensil Mekanik · Pentel · Hekter · Spidol · Stabilo · Cat Poster · Lem · Parcel · Kotak Pensil · Kertas · Kalkulator · Tinta. Daftar ini dari foto yang dikirim pemilik; pengelompokan ke 2 tingkat disusun saat import data. |
| Pilih kategori | `/kategori/[slug]` dengan filter **merek**, rentang harga, dan urutan (termurah, terbaru, A–Z). |
| Jumlah barang | Angka jumlah barang di samping nama kategori. |

### Fase 2 — Pesan via WhatsApp, Info Toko

#### 5.4 Pesan via WhatsApp
| Sub fitur | Kebutuhan |
|---|---|
| Tombol pesan | Di kartu & detail barang: "Tambah ke daftar" (setelah pilih varian & satuan). |
| Daftar pesanan | Keranjang ringan tanpa login (`localStorage`): ubah jumlah/satuan, hapus, total perkiraan. |
| Pesan terisi otomatis | Membuka `https://wa.me/6282348485101?text=...` dengan format di bawah. Nomor disimpan di `store_settings`, tidak di-hardcode. |
| Kode pesanan | Sebelum WA dibuka, pesanan disimpan ke database dengan kode `NA-261007-014`, supaya pegawai bisa menyiapkan barang dari panel. |
| Ambil / antar | Pilihan "Siapkan, saya ambil di toko" atau "Minta diantar (ongkir dikonfirmasi)". |

Contoh pesan:

```
Halo Toko New Agung, saya mau pesan:

1. Pulpen Pentel Energel 0.5 (Biru) — 1 lusin × Rp…
2. Kertas A4 70gr — 2 rim × Rp…
3. Buku Tulis 58 lbr — 10 pcs × Rp…

Perkiraan total: Rp…
Kode pesanan: NA-261007-014

Nama: Rina
Ambil di toko, jam 16.00
```

Harga di pesan adalah **perkiraan**; teks kecil di keranjang menjelaskan bahwa harga
akhir dan stok dikonfirmasi toko.

#### 5.5 Info Toko & Kontak
| Sub fitur | Kebutuhan |
|---|---|
| Alamat & lokasi | Alamat (lihat §1) + peta (embed, dimuat saat discroll) + tombol "Rute" ke Google Maps. |
| Jam buka | "Buka setiap hari, 05.00–22.00 WITA" + status langsung "Buka · tutup 22.00" / "Tutup · buka 05.00". Dihitung dalam WITA, jadi tetap benar untuk pengunjung dari zona waktu lain. Jam tetap bisa diubah pemilik di panel. |
| Kontak toko | Telepon (0411) 850555 (tombol `tel:`), WhatsApp 0823-4848-5101, media sosial jika ada. |
| Ulasan Google | Tampilkan "4,5 ★ · 10.000+ ulasan di Google" dengan link ke profil Google. Tidak menyalin atau menulis ulasan palsu di website. |
| Data terstruktur | JSON-LD `Store`/`LocalBusiness` (alamat, telepon, jam, geo) + `Product`. |

### Fase 3 — Panel Pemilik

#### 5.6 Masuk Pemilik
| Sub fitur | Kebutuhan |
|---|---|
| Masuk akun | Supabase Auth: email + password atau magic link, di `/panel/masuk`. |
| Lupa kata sandi | Reset via email (bawaan Supabase). |
| Atur akses pegawai | Peran `owner` dan `staff`. Pemilik mengundang dan menonaktifkan pegawai. |

| Aksi | owner | staff |
|---|:-:|:-:|
| Tambah/ubah barang & varian, ubah harga | ✓ | ✓ |
| Hapus barang, ubah kategori | ✓ | – |
| Lihat & ubah status pesanan | ✓ | ✓ |
| Ubah info toko, jam buka | ✓ | – |
| Kelola pegawai | ✓ | – |

#### 5.7 Kelola Barang Toko
| Sub fitur | Kebutuhan |
|---|---|
| Tambah & ubah barang | Form satu kolom, ramah HP. Foto langsung dari kamera, dikompres di browser sebelum upload. Varian diisi sebagai tabel kecil (warna/ukuran, harga, stok). |
| Perbarui harga | Mode "ubah harga cepat": daftar barang/varian dengan kolom harga yang bisa diedit langsung. Riwayat perubahan harga disimpan. Opsi "naikkan semua barang merek X sebesar n%" untuk kenaikan harga dari distributor. |
| Atur kategori | Tambah, ganti nama, ubah urutan, pindahkan barang. |
| Import/Export | Upload Excel/CSV (termasuk ekspor dari program kasir) untuk input massal; export untuk cadangan. |

Halaman **Pesanan Masuk**: status `baru → disiapkan → siap diambil/diantar → selesai / batal`.

### Fase 4 — Favorit & Pesan Lagi

Tanpa akun pelanggan. Data disimpan di perangkat (`localStorage`), dengan keterangan
bahwa data hilang jika browser dibersihkan.

| Sub fitur | Kebutuhan |
|---|---|
| Simpan favorit | Ikon simpan di kartu barang; halaman `/favorit`. |
| Riwayat pesanan | Pesanan yang pernah dikirim dari perangkat ini (kode, tanggal, isi). |
| Pesan ulang sekali klik | Penting untuk pembeli kantor yang belanja rutin. Isi ulang keranjang dengan **harga terbaru**, tandai barang yang harganya berubah atau habis, lalu kirim ke WA. |

### 5.8 Usulan tambahan (setelah Fase 4, perlu persetujuan)

**Paket daftar sekolah.** Pemilik menyusun paket per jenjang/sekolah ("Paket SD
Kelas 1", "Daftar SMP Negeri X"). Orang tua tinggal klik "Masukkan semua ke daftar",
lalu menyesuaikan isinya. Ini fitur yang paling relevan untuk mengurangi antrean di musim
sekolah.


## 6. Arah desain

Website toko lokal sering terlihat "buatan AI" karena polanya seragam: gradien
ungu-biru, kartu kaca (glassmorphism), ikon 3D, hero bertuliskan "Solusi Terbaik untuk
Kebutuhan Anda", foto stok orang tersenyum. Semua itu **tidak dipakai**.

### 6.1 Konsep: "Rak ATK & Label Harga"

Bahasa visual diambil dari benda yang memang ada di toko: **papan gantung lorong,
label harga di rak, nota, dan rak yang penuh warna**. Hasilnya terasa seperti toko itu
sendiri.

- **Papan lorong jadi navigasi.** Di toko, tiap lorong punya papan putih bergantung
  bertuliskan huruf kapital hitam ("SPIDOL/STABILO · CAT POSTER/LEM"). Di website,
  kategori ditampilkan dengan gaya yang sama: kotak putih, garis tipis, teks kapital
  rapat, dua baris. Pelanggan langsung merasa sedang "berjalan di lorong" toko yang
  mereka kenal.
- **Keranjang, bukan "cart".** Toko ini swalayan berkeranjang merah, jadi istilah dan
  ikonnya "Keranjang".

- **Warnanya datang dari barang, bukan dari UI.** Toko ATK sudah penuh warna (pulpen,
  spidol, map). UI dibuat tenang (kertas, tinta, satu warna aksen) supaya foto barang
  dan titik warna varian yang menonjol.
- **Harga adalah tokoh utama.** Ditulis besar dengan angka tabular, seperti label harga
  rak. Nama barang dan merek di bawahnya.
- **Grid rapat seperti rak**, bukan kartu besar berjarak lebar. Di HP: 2 kolom; desktop: 5–6.
- **Garis, bukan bayangan.** Pemisah 1 px, sudut kecil (4–6 px). Latar halaman daftar
  pesanan memakai pola garis tipis kertas bergaris.
- **Foto asli toko**: tampak depan Jl. Ratulangi, lorong kertas warna, etalase
  kalkulator Casio, meja layanan pulpen. Foto lorong yang penuh warna sudah menjelaskan
  toko ini lebih baik dari kalimat apa pun. Pakai sebagai gambar utama beranda, dengan
  izin dan tanpa wajah pelanggan yang jelas terlihat.
- **Bahasa sehari-hari**: "Cari pulpen, kertas, map…", "Ada", "Stok habis",
  "Pesan lewat WA".

### 6.2 Token desain

| Token | Nilai | Pemakaian |
|---|---|---|
| `--paper` | `#F7F5EF` | Latar (kertas, hangat, bukan putih murni) |
| `--ink` | `#1B1C1E` | Teks utama |
| `--ink-muted` | `#66676B` | Teks sekunder |
| `--line` | `#DEDBD2` | Garis pemisah |
| `--ruled` | `#C9D6E8` | Garis kertas bergaris (dekoratif tipis) |
| `--brand` | `#282C83` | Biru logo: header, papan kategori, link, fokus |
| `--accent` | `#D11D20` | Merah logo: tombol utama, angka keranjang, label promo |
| `--wa` | `#1F8A4C` | Khusus tombol WhatsApp |
| `--ok` / `--warn` | `#2F6B3A` / `#A86A00` | Status "Ada" / "Sisa sedikit" |

Mode gelap: `--paper #131416`, `--ink #ECEBE6`, `--line #2B2C2F`,
`--brand #9AA0F2`, `--accent #EF5350`.

Warna `--brand` dan `--accent` diambil langsung dari logo. Pemakaiannya dijaga
**hemat**: biru untuk struktur (header, papan kategori), merah hanya untuk satu aksi
utama per layar. Halaman tetap didominasi warna kertas dan foto barang, bukan biru-merah
penuh seperti spanduk.

**Logo**

- Logo yang ada masih berupa gambar beresolusi rendah. Di Fase 0, logo **digambar ulang
  sebagai SVG** (segitiga + lengkung biru, "AGUNG", "New" + sapuan) supaya tajam di semua
  ukuran dan bisa dipakai versi terang/gelap.
- Turunan: favicon & ikon aplikasi (segitiga biru saja), gambar Open Graph untuk
  link yang dibagikan di WA.
- Huruf "AGUNG" di logo hanya dipakai sebagai logo, tidak jadi font UI.

**Tipografi**

| Peran | Font | Catatan |
|---|---|---|
| Judul & harga | **Archivo** (variable, sumbu *width* condensed untuk harga) | Seperti cetakan label harga |
| Teks | **Archivo** lebar normal | Satu keluarga font agar ringan |
| Kode barang, kode pesanan | **IBM Plex Mono** | Kesan nota/struk |

Angka harga: `font-variant-numeric: tabular-nums`.

### 6.3 Komponen kunci

- **Kartu barang:** foto 1:1, harga besar, nama 2 baris maksimal, merek kecil, deretan
  titik warna varian (maks 5 + "+3"), tombol `+` kecil di pojok.
- **Pemilih varian:** titik warna untuk warna, *segmented control* untuk ukuran/satuan.
  Harga berubah langsung saat varian/satuan dipilih.
- **Header HP:** logo + kotak cari penuh + ikon daftar pesanan berangka.
- **Bar bawah (HP):** Beranda · Kategori · Favorit · Daftar Pesanan.
- **Status buka:** pil kecil "● Buka · tutup 22.00".
- **Daftar pesanan:** *bottom sheet* bergaya nota (garis putus-putus, total di bawah,
  tombol hijau WhatsApp).
- **Beranda:** kotak cari besar → kategori sebagai deretan ikon garis sederhana →
  "Sering dicari" → "Baru masuk" → blok info toko (jam, alamat, rute, 4,5 ★ Google).
  Tanpa carousel banner raksasa.

### 6.4 Gerak

Hanya transisi fungsional 150–200 ms (sheet naik, angka keranjang bertambah). Tanpa
scroll-reveal, parallax, atau teks yang muncul huruf per huruf. Hormati
`prefers-reduced-motion`.

### 6.5 Struktur halaman

```
/                      Beranda
/kategori/[slug]       Barang per kategori (filter merek, harga)
/merek/[slug]          Barang per merek (Pentel, Kenko, Joyko, …)
/cari?q=               Hasil pencarian
/barang/[slug]         Detail barang + varian
/pesanan               Daftar pesanan + kirim ke WA
/favorit               Favorit & riwayat (Fase 4)
/tentang               Info toko, jam, peta, kontak
/panel/...             Panel pemilik (Fase 3)
```

## 7. Arsitektur teknis

```
 Browser (HP pelanggan / pemilik)
        │
        ▼
 Next.js (App Router, Vercel)
  - halaman publik: Server Components + ISR (revalidate saat harga diubah)
  - panel: Client Components
        │  REST/JSON
        ▼
 Express API (Node 22, Railway/Render/Fly)
  - validasi zod, rate limit, logging
  - verifikasi JWT Supabase untuk rute panel
        │  supabase-js (service role, hanya di server)
        ▼
 Supabase (region Singapura)
  - Postgres (data), Storage (foto), Auth (pemilik & pegawai)
```

### 7.1 Pilihan teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js (versi stabil terbaru, App Router), TypeScript, Tailwind CSS v4 | SEO untuk ribuan halaman barang, ISR membuat katalog cepat |
| UI dasar | Radix UI primitives (atau shadcn/ui yang **di-restyle penuh** dengan token di atas) | Aksesibel; tampilan default shadcn tidak dipakai mentah |
| State keranjang/favorit | Zustand + `persist` ke localStorage | Ringan, tanpa login |
| Backend | Express 5, TypeScript, zod, helmet, express-rate-limit, pino | Sesuai permintaan |
| Database | **Supabase (Postgres)** | Lihat 7.2 |
| Gambar | Supabase Storage + `next/image` | Satu tempat dengan data |
| Hosting | Vercel (web), Railway/Render (API), Supabase Cloud Singapura | Latensi rendah dari Makassar |

### 7.2 Supabase vs MongoDB

Rekomendasi: **Supabase.**

- Data toko ATK sangat relasional: barang ↔ varian ↔ satuan/harga bertingkat ↔
  kategori ↔ merek ↔ item pesanan ↔ riwayat harga.
- Pencarian toleran salah ketik (`pg_trgm`) dan full-text sudah ada di Postgres.
- Auth dan Storage untuk foto sudah satu paket.
- Ada Table Editor untuk perbaikan data darurat tanpa panel.

MongoDB lebih unggul jika atribut barang sangat bebas per kategori. Di Postgres, itu
cukup ditangani kolom `attributes jsonb`.

### 7.3 Model data (ringkas)

```sql
categories (id uuid pk, parent_id uuid null → categories, name, slug unique, sort_order)

brands (id uuid pk, name, slug unique)

products (
  id uuid pk, category_id → categories, brand_id → brands null,
  name, slug unique, description, attributes jsonb default '{}',
  is_active bool default true, search tsvector generated, created_at, updated_at
)

product_variants (
  id uuid pk, product_id → products,
  label text,                 -- 'Biru', '0.5 mm', '58 lembar'
  color_hex text null,        -- untuk titik warna
  sku text null,              -- kode dari program kasir
  stock_status text check (in ('ada','sedikit','habis')),
  sort_order int
)

variant_prices (              -- harga bertingkat per satuan
  id uuid pk, variant_id → product_variants,
  unit text,                  -- 'pcs' | 'lusin' | 'pak' | 'rim' | 'box'
  qty_per_unit int,           -- 1, 12, 10, 500, ...
  price integer               -- rupiah, tanpa desimal
)

product_images (id, product_id → products, variant_id null, path, sort_order)

search_synonyms (term text, synonym text)          -- 'tipe-x' ↔ 'correction'

price_history (id, variant_price_id, old_price, new_price, changed_by → auth.users, changed_at)

orders (id uuid pk, code unique, customer_name, fulfilment, pickup_note,
        status default 'baru', estimated_total int, created_at)

order_items (id, order_id → orders, variant_id → product_variants,
             name_snapshot, unit_snapshot, price_snapshot int, qty int)

store_settings (id = 1, name, address, lat, lng, maps_url, phone, whatsapp,
                opening_hours jsonb, timezone default 'Asia/Makassar')
-- opening_hours awal: setiap hari {"open":"05:00","close":"22:00"}

staff (user_id → auth.users pk, role check (in ('owner','staff')), active bool)

search_misses (id, query, created_at)
```

Harga disimpan sebagai **integer rupiah**. `order_items` menyimpan snapshot nama,
satuan, dan harga agar riwayat tidak berubah saat harga diubah. Row Level Security aktif
di semua tabel; Next.js tidak pernah memegang service role key.

### 7.4 Endpoint API

Publik:
```
GET  /api/categories                    daftar + jumlah barang
GET  /api/brands
GET  /api/products?category=&brand=&sort=&page=
GET  /api/products/:slug                termasuk varian & harga bertingkat
GET  /api/search?q=
GET  /api/search/suggest?q=             maks 6
POST /api/orders                        simpan pesanan → { code, waUrl }
POST /api/variants/prices               harga terbaru untuk "pesan ulang"
GET  /api/store                         info toko + status buka (WITA)
```

Panel (`Authorization: Bearer <supabase jwt>`):
```
POST/PATCH/DELETE /api/admin/products[/:id]
POST/PATCH/DELETE /api/admin/products/:id/variants[/:variantId]
PATCH             /api/admin/prices            (massal: per barang atau % per merek)
POST              /api/admin/import            (CSV/XLSX)
GET               /api/admin/export
POST/PATCH/DELETE /api/admin/categories[/:id], /api/admin/brands[/:id]
GET/PATCH         /api/admin/orders[/:id]
PATCH             /api/admin/store
GET/POST/PATCH    /api/admin/staff
```

Setelah perubahan barang/harga, Express memanggil endpoint revalidate Next.js
(`revalidateTag`) agar halaman publik langsung diperbarui.

### 7.5 Struktur repo

```
agung-website/
  apps/
    web/        Next.js
    api/        Express
  packages/
    shared/     tipe & skema zod bersama
  supabase/
    migrations/ SQL
    seed/       import data awal
  docs/
    PRD.md
```

Monorepo dengan pnpm workspaces.

## 8. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Performa | LCP < 2,5 dtk (HP kelas menengah, 4G lambat); CLS < 0,1; JS halaman publik < 200 KB |
| Skala katalog | Nyaman untuk 5.000+ varian (pagination/infinite scroll, index pencarian) |
| Aksesibilitas | WCAG 2.2 AA; target sentuh ≥ 44 px; warna varian juga punya label teks |
| SEO | Metadata per barang/kategori/merek, sitemap, JSON-LD, kata kunci lokal ("toko ATK Makassar", "alat tulis Jl. Ratulangi") |
| Keamanan | RLS, rate limit `POST /api/orders` (10/menit/IP) + honeypot, validasi zod, CORS hanya domain web |
| Keandalan | Backup harian Supabase + export CSV mingguan |
| Analitik | Plausible/Umami (tanpa banner cookie): klik "Pesan", kata kunci cari & tidak ketemu |

## 9. Jadwal kasar

| Fase | Isi | Perkiraan |
|---|---|---|
| 0 | Setup monorepo & Supabase, domain `newagung.com`, logo SVG & token desain, sesi foto toko, data contoh (data asli menyusul) | 1 minggu |
| 1 | Katalog + varian, pencarian + sinonim, kategori & merek | 2,5 minggu |
| 2 | Pesan via WA, info toko, SEO lokal | 1,5 minggu |
| 3 | Login, kelola barang & varian, ubah harga massal, pesanan masuk, pegawai | 3 minggu |
| 4 | Favorit, riwayat, pesan ulang | 1 minggu |

Jika memungkinkan, Fase 1–2 sebaiknya live **sebelum Juni**, menjelang tahun ajaran baru.

## 10. Risiko

| Risiko | Mitigasi |
|---|---|
| Ribuan barang & varian, input awal berat | Import dari program kasir; barang tanpa foto tetap tampil rapi; foto dilengkapi bertahap |
| Harga tidak diperbarui | Ubah harga cepat + ubah massal per merek; label "harga dikonfirmasi toko"; tanggal "diperbarui" di detail |
| Lonjakan pesanan musim sekolah | Status pesanan di panel; opsi jam ambil; pengingat batas waktu ambil |
| Spam pesanan | Rate limit + honeypot |

## 11. Status konfirmasi pemilik toko

| Hal | Status |
|---|---|
| Nomor WhatsApp pesanan | Selesai: 0823-4848-5101 |
| Printech di website | Selesai: tidak perlu |
| Jam buka | Selesai: setiap hari 05.00–22.00, tanpa libur |
| Papan lorong / kategori | Selesai: dari foto toko |
| Logo | Selesai: diterima, digambar ulang ke SVG di Fase 0 |
| Domain | Selesai: `newagung.com` (sementara) |
| Data barang (ekspor kasir / daftar harga) | **Menyusul.** Dibutuhkan sebelum Fase 1 bisa diisi data asli; sampai saat itu pengembangan memakai data contoh. |
| Izin memakai foto toko di website | **Belum dijawab** |
