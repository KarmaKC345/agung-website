# PRD — Website Toko New Agung

| | |
|---|---|
| Status | Draft v1 — perencanaan |
| Tanggal | 7 Oktober 2026 |
| Stack | Next.js (frontend) · Express (API) · Supabase/Postgres (database, storage, auth) |
| Sumber roadmap | Peta fitur "Toko New Agung" (Fase 1–4) |

> Data yang ditandai **[KONFIRMASI]** belum bisa diverifikasi dari link referensi
> (Google share link tidak bisa diakses dari environment build). Isi dari pemilik toko
> sebelum Fase 2 dimulai.

---

## 1. Latar belakang

Toko New Agung saat ini melayani pelanggan lewat datang langsung dan chat WhatsApp.
Pertanyaan yang paling sering masuk biasanya sama: *"barang X ada?"*, *"harganya berapa?"*,
*"tokonya buka jam berapa?"*. Pemilik menjawab satu per satu, dan daftar harga hanya
ada di kepala atau di buku.

Website ini **bukan marketplace** dan tidak memproses pembayaran. Tujuannya sederhana:
pelanggan bisa melihat barang dan harga kapan saja, lalu pesan lewat WhatsApp dengan
pesan yang sudah rapi. Transaksi tetap terjadi seperti biasa — di toko atau lewat chat.

## 2. Tujuan & ukuran keberhasilan

| Tujuan | Ukuran (3 bulan setelah Fase 2 live) |
|---|---|
| Pelanggan menemukan barang tanpa bertanya | ≥ 60% sesi pencarian berakhir di halaman detail barang |
| Chat WA lebih rapi | ≥ 50% chat pesanan masuk lewat tombol "Pesan" (format terisi otomatis) |
| Harga di web selalu benar | Pemilik bisa ubah harga dalam < 30 detik dari HP |
| Cepat di HP murah & sinyal lemah | LCP < 2,5 dtk di 4G lambat, halaman katalog < 200 KB JS |

**Bukan tujuan (out of scope v1):** pembayaran online, ongkir otomatis, akun pelanggan
dengan password, multi-cabang, aplikasi mobile native.

## 3. Pengguna

**Pelanggan (mayoritas di HP).** Datang dari Google Maps, link WA, atau status WA toko.
Mau cepat: cari barang, lihat harga, tanya stok, pesan. Tidak mau daftar akun.

**Pemilik toko.** Mengurus harga dan barang di sela melayani pembeli. Butuh panel yang
bisa dipakai satu tangan di HP, bukan dashboard rumit.

**Pegawai.** Membantu input barang dan melihat pesanan masuk, tanpa akses ke pengaturan
akun atau hapus data massal.

## 4. Ruang lingkup per fase

Urutan mengikuti peta fitur. Satu catatan penting: katalog (Fase 1) butuh data barang,
sedangkan panel "Kelola Barang" baru ada di Fase 3. Untuk menjembatani, data awal di
Fase 1 diisi lewat **import CSV/Excel** (script seed) atau Table Editor Supabase.

### Fase 1 — Katalog, Pencarian, Kategori

#### 4.1 Katalog Barang
| Sub fitur | Kebutuhan |
|---|---|
| Daftar barang & harga | Grid barang: foto, nama, harga, satuan (pcs/dus/meter/kg). Harga format `Rp12.500`. Barang yang tidak dijual ditandai "Stok habis", tidak disembunyikan. |
| Foto barang | 1–5 foto per barang, dikompres ke WebP/AVIF lewat `next/image`. Jika belum ada foto, tampilkan placeholder berupa inisial nama barang — bukan ilustrasi stok. |
| Rincian barang | Halaman `/barang/[slug]`: foto, harga, satuan, merek, deskripsi singkat, kategori, tombol pesan. |
| Harga grosir *(tambahan)* | Opsional per barang: "≥ 10 pcs Rp11.000". Banyak toko punya harga beda untuk partai. |

#### 4.2 Pencarian Barang
| Sub fitur | Kebutuhan |
|---|---|
| Kotak pencarian | Selalu terlihat di header (sticky di HP). |
| Saran kata kunci | Muncul setelah 2 huruf, debounce 200 ms, maksimal 6 saran. |
| Hasil pencarian | Toleran salah ketik dan sinonim lokal ("paku" ≈ "paku beton"). Pakai Postgres full-text search + `pg_trgm`. |
| Pencarian kosong *(tambahan)* | Jika tidak ketemu: tombol "Tanya stok via WhatsApp" dengan kata kunci sudah terisi. Kata kunci yang tidak ketemu dicatat → jadi daftar barang yang perlu ditambah pemilik. |

#### 4.3 Kategori Barang
| Sub fitur | Kebutuhan |
|---|---|
| Daftar kategori | Di beranda dan di menu. Maksimal 2 tingkat (Kategori → Sub-kategori). |
| Pilih kategori | `/kategori/[slug]` dengan filter harga dan urutan (termurah, terbaru, A–Z). |
| Jumlah barang | Angka jumlah barang di samping nama kategori. |

### Fase 2 — Pesan via WhatsApp, Info Toko

#### 4.4 Pesan via WhatsApp
| Sub fitur | Kebutuhan |
|---|---|
| Tombol pesan | Di kartu barang dan halaman detail: "Tambah ke daftar" dan "Pesan sekarang". |
| Daftar pesanan | Keranjang ringan (tanpa login, disimpan di `localStorage`): ubah jumlah, hapus, total perkiraan. |
| Pesan terisi otomatis | Membuka `wa.me/<nomor>?text=...` dengan format di bawah. |
| Kode pesanan *(tambahan)* | Sebelum membuka WA, pesanan disimpan ke database dengan kode `NA-261007-014`. Pemilik bisa mencocokkan chat dengan data di panel. |

Contoh pesan yang terkirim:

```
Halo Toko New Agung, saya mau pesan:

1. Semen Tiga Roda 40kg — 2 sak × Rp62.000
2. Paku 5cm — 1 kg × Rp24.000

Perkiraan total: Rp148.000
Kode pesanan: NA-261007-014

Nama: Budi
Ambil di toko / minta diantar: Ambil di toko
```

Harga di pesan adalah **perkiraan**; teks kecil di keranjang menjelaskan bahwa harga
akhir dikonfirmasi oleh toko.

#### 4.5 Info Toko & Kontak
| Sub fitur | Kebutuhan |
|---|---|
| Alamat & lokasi | Alamat teks + peta (embed Google Maps, dimuat saat discroll) + tombol "Petunjuk arah". **[KONFIRMASI alamat]** |
| Jam buka | Tabel jam per hari + status langsung "Buka sekarang · tutup 17.00" (zona waktu `Asia/Makassar` atau `Asia/Jakarta` — **[KONFIRMASI]**). Hari libur khusus bisa diatur pemilik. |
| Kontak toko | WhatsApp, telepon, Instagram/Facebook jika ada. **[KONFIRMASI nomor]** |
| Data terstruktur *(tambahan)* | JSON-LD `LocalBusiness` + `Product` agar muncul rapi di Google. |

### Fase 3 — Panel Pemilik

#### 4.6 Masuk Pemilik
| Sub fitur | Kebutuhan |
|---|---|
| Masuk akun | Supabase Auth: email + password, atau magic link. Halaman `/panel/masuk`. |
| Lupa kata sandi | Reset via email (bawaan Supabase). |
| Atur akses pegawai | Dua peran: `owner` dan `staff`. Pemilik mengundang pegawai lewat email dan bisa menonaktifkan aksesnya. |

Hak akses:

| Aksi | owner | staff |
|---|:-:|:-:|
| Tambah/ubah barang, ubah harga | ✓ | ✓ |
| Hapus barang, ubah kategori | ✓ | – |
| Lihat & ubah status pesanan | ✓ | ✓ |
| Ubah info toko, jam buka | ✓ | – |
| Kelola pegawai | ✓ | – |

#### 4.7 Kelola Barang Toko
| Sub fitur | Kebutuhan |
|---|---|
| Tambah & ubah barang | Form satu kolom, ramah HP. Foto langsung dari kamera HP, dikompres di browser sebelum upload. |
| Perbarui harga | Mode "ubah harga cepat": daftar barang dengan kolom harga yang bisa diedit langsung (inline), simpan per baris. Riwayat perubahan harga disimpan. |
| Atur kategori | Tambah, ganti nama, ubah urutan (drag), pindahkan barang. |
| Import/Export *(tambahan)* | Upload Excel/CSV untuk input massal; export untuk cadangan. |

Panel juga punya halaman **Pesanan Masuk**: daftar pesanan dari web dengan status
`baru → diproses → selesai / batal`.

### Fase 4 — Favorit & Pesan Lagi

Tanpa akun pelanggan. Semua tersimpan di perangkat pelanggan (`localStorage`), dengan
penjelasan singkat bahwa data hilang jika browser dibersihkan.

| Sub fitur | Kebutuhan |
|---|---|
| Simpan favorit | Ikon simpan di kartu barang; halaman `/favorit`. |
| Riwayat pesanan | Daftar pesanan yang pernah dikirim dari perangkat ini (kode, tanggal, isi). |
| Pesan ulang sekali klik | Isi ulang keranjang dengan **harga terbaru** dari server, tandai barang yang harganya berubah atau habis, lalu kirim ke WA. |

## 5. Arah desain

Website toko lokal paling sering terlihat "buatan AI" karena memakai pola yang sama:
gradien ungu-biru, kartu kaca (glassmorphism), ikon 3D, hero dengan kalimat
"Solusi Terbaik untuk Kebutuhan Anda", dan foto stok orang tersenyum. Semua itu
**dilarang** di proyek ini.

### 5.1 Konsep: "Nota & Etalase"

Bahasa visual diambil dari benda yang memang ada di toko: **label harga, nota,
rak etalase, papan nama toko**. Hasilnya terasa seperti toko itu sendiri, bukan template.

- **Harga adalah tokoh utama.** Harga ditulis besar, huruf tabular (angka sejajar),
  seperti label harga yang ditempel di rak. Nama barang di bawahnya.
- **Grid rapat seperti etalase**, bukan kartu-kartu besar berjarak lebar. Di HP:
  2 kolom. Pelanggan ingin melihat banyak barang sekaligus.
- **Garis, bukan bayangan.** Pemisah 1 px, sudut kecil (4–6 px). Tidak ada `shadow-xl`.
- **Foto asli dari toko** (rak, papan nama, pemilik di meja kasir). Satu sesi foto
  dengan HP yang bagus sudah cukup dan jauh lebih meyakinkan dari foto stok.
- **Bahasa Indonesia sehari-hari**: "Cari barang…", "Ada", "Stok habis",
  "Pesan lewat WA". Hindari bahasa iklan.

### 5.2 Token desain

| Token | Nilai | Pemakaian |
|---|---|---|
| `--paper` | `#F6F3EC` | Latar (kertas nota, hangat — bukan putih murni) |
| `--ink` | `#1C1B19` | Teks utama |
| `--ink-muted` | `#6B675F` | Teks sekunder |
| `--line` | `#DDD7CB` | Garis pemisah |
| `--accent` | `#C8361D` | Merah papan toko — tombol utama, label "promo" |
| `--price` | `#1C1B19` | Harga (hitam tebal, bukan warna) |
| `--wa` | `#1F8A4C` | Khusus tombol WhatsApp |
| `--ok` / `--warn` | `#2F6B3A` / `#A86A00` | Status "Ada" / "Sisa sedikit" |

Mode gelap: `--paper #141311`, `--ink #EEEAE1`, `--line #2C2A26`, aksen tetap merah
yang sedikit diterangkan (`#E0533A`).

> Warna merah aksen sebaiknya disesuaikan dengan papan nama / logo asli toko
> **[KONFIRMASI — kirim foto papan nama]**.

**Tipografi**

| Peran | Font | Catatan |
|---|---|---|
| Judul & harga | **Archivo** (variable, pakai sumbu *width* condensed untuk harga) | Terasa seperti cetakan label harga |
| Teks | **Archivo** normal width | Satu keluarga font agar ringan |
| Kode, SKU, kode pesanan | **IBM Plex Mono** | Kesan nota/struk |

Semua angka harga: `font-variant-numeric: tabular-nums`.

### 5.3 Komponen kunci

- **Kartu barang:** foto rasio 1:1 di latar `--paper` sedikit lebih gelap, harga besar,
  nama 2 baris maksimal, satuan kecil, tombol `+` kecil di pojok. Tidak ada deskripsi.
- **Header HP:** logo kecil + kotak cari penuh + ikon daftar pesanan dengan angka.
- **Bar bawah (HP):** Beranda · Kategori · Favorit · Daftar Pesanan.
- **Status buka:** pil kecil di header "● Buka · tutup 17.00".
- **Keranjang:** tampil sebagai *bottom sheet* bergaya nota — garis putus-putus,
  total di bawah, tombol hijau WhatsApp.

### 5.4 Gerak

Hanya transisi fungsional 150–200 ms (sheet naik, angka keranjang bertambah).
Tidak ada animasi scroll-reveal, parallax, atau teks yang muncul huruf per huruf.
Hormati `prefers-reduced-motion`.

### 5.5 Struktur halaman

```
/                      Beranda: cari, kategori, barang terbaru/terlaris, info toko singkat
/kategori/[slug]       Daftar barang per kategori
/cari?q=               Hasil pencarian
/barang/[slug]         Detail barang
/pesanan               Daftar pesanan (keranjang) + kirim ke WA
/favorit               Favorit & riwayat (Fase 4)
/tentang               Info toko, jam buka, peta, kontak
/panel/...             Panel pemilik (Fase 3)
```

## 6. Arsitektur teknis

```
 Browser (HP pelanggan / pemilik)
        │
        ▼
 Next.js (App Router, Vercel)
  - halaman publik: Server Components + ISR (revalidate saat harga diubah)
  - panel: Client Components
        │  REST/JSON (fetch)
        ▼
 Express API (Node 22, Railway/Render/Fly)
  - validasi (zod), rate limit, logging
  - verifikasi JWT Supabase untuk rute panel
        │  supabase-js (service role, hanya di server)
        ▼
 Supabase
  - Postgres (data), Storage (foto), Auth (pemilik & pegawai)
```

### 6.1 Pilihan teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js (versi stabil terbaru, App Router), TypeScript, Tailwind CSS v4 | SEO bagus untuk halaman barang, ISR membuat katalog cepat tanpa beban server |
| UI dasar | Radix UI primitives (atau shadcn/ui yang **di-restyle penuh** dengan token di atas) | Aksesibel; tampilan default shadcn tidak dipakai mentah-mentah |
| State keranjang/favorit | Zustand + `persist` ke localStorage | Ringan, tanpa login |
| Backend | Express 5, TypeScript, zod, helmet, express-rate-limit, pino | Sesuai permintaan; cukup untuk skala toko |
| Database | **Supabase (Postgres)** | Lihat 6.2 |
| Gambar | Supabase Storage + `next/image` | Satu tempat dengan data |
| Hosting | Vercel (Next.js), Railway/Render (Express), Supabase Cloud region Singapura | Latensi rendah dari Indonesia |

### 6.2 Supabase vs MongoDB

Rekomendasi: **Supabase.**

- Data toko bersifat relasional: barang ↔ kategori ↔ item pesanan ↔ riwayat harga.
  Postgres cocok secara alami.
- Pencarian toleran salah ketik (`pg_trgm`) dan full-text sudah tersedia tanpa layanan tambahan.
- Auth dan Storage (foto) sudah satu paket — dengan MongoDB perlu menambah layanan auth
  dan penyimpanan file sendiri.
- Ada Table Editor: pemilik/developer bisa memperbaiki data darurat tanpa panel.

MongoDB baru lebih unggul jika atribut barang sangat bervariasi per kategori. Untuk
kasus itu, Postgres cukup memakai kolom `attributes jsonb`.

### 6.3 Model data (ringkas)

```sql
categories (
  id uuid pk, parent_id uuid null → categories, name text, slug text unique,
  sort_order int, created_at timestamptz
)

products (
  id uuid pk, category_id uuid → categories, name text, slug text unique,
  brand text, description text, unit text,            -- 'pcs' | 'dus' | 'kg' | ...
  price integer,                                      -- rupiah, tanpa desimal
  wholesale_min_qty int null, wholesale_price integer null,
  stock_status text check (in ('ada','sedikit','habis')),
  attributes jsonb default '{}', is_active boolean default true,
  search tsvector generated, created_at, updated_at
)

product_images (id, product_id → products, path text, sort_order int)

price_history (id, product_id → products, old_price int, new_price int,
               changed_by uuid → auth.users, changed_at timestamptz)

orders (
  id uuid pk, code text unique,                        -- NA-261007-014
  customer_name text, fulfilment text,                 -- 'ambil' | 'antar'
  status text default 'baru', estimated_total int, created_at
)

order_items (id, order_id → orders, product_id → products,
             name_snapshot text, price_snapshot int, qty int)

store_settings (id = 1, name, address, maps_url, whatsapp, phone,
                opening_hours jsonb, holidays jsonb, timezone text)

staff (user_id → auth.users pk, role text check (in ('owner','staff')), active bool)

search_misses (id, query text, created_at)            -- kata kunci yang tidak ketemu
```

Harga disimpan sebagai **integer rupiah** (tanpa float). `order_items` menyimpan
snapshot nama dan harga agar riwayat tidak berubah saat harga barang diubah.
Row Level Security aktif di semua tabel; Next.js tidak pernah memegang service role key.

### 6.4 Endpoint API

Publik:
```
GET  /api/categories                  daftar + jumlah barang
GET  /api/products?category=&sort=&page=
GET  /api/products/:slug
GET  /api/search?q=                   hasil
GET  /api/search/suggest?q=           saran (maks 6)
POST /api/orders                      simpan pesanan → { code, waUrl }
POST /api/products/prices             harga terbaru untuk "pesan ulang"
GET  /api/store                       info toko + status buka
```

Panel (header `Authorization: Bearer <supabase jwt>`):
```
POST/PATCH/DELETE /api/admin/products[/:id]
PATCH             /api/admin/products/:id/price
POST              /api/admin/products/import        (CSV/XLSX)
POST/PATCH/DELETE /api/admin/categories[/:id]
GET/PATCH         /api/admin/orders[/:id]
PATCH             /api/admin/store
GET/POST/PATCH    /api/admin/staff
```

Setelah perubahan barang/harga, Express memanggil endpoint revalidate Next.js
(`revalidateTag('products')`) agar halaman publik langsung diperbarui.

### 6.5 Struktur repo

```
agung-website/
  apps/
    web/        Next.js
    api/        Express
  packages/
    shared/     tipe & skema zod bersama (Product, Order, ...)
  supabase/
    migrations/ SQL
    seed/       import CSV awal
  docs/
    PRD.md
```

Monorepo dengan pnpm workspaces.

## 7. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Performa | LCP < 2,5 dtk (HP kelas menengah, 4G lambat); CLS < 0,1; JS halaman publik < 200 KB |
| Aksesibilitas | WCAG 2.2 AA: kontras, target sentuh ≥ 44 px, navigasi keyboard di panel |
| SEO | Metadata per barang & kategori, sitemap, JSON-LD `LocalBusiness`/`Product`, URL berbahasa Indonesia |
| Keamanan | RLS Supabase, rate limit `POST /api/orders` (mis. 10/menit/IP), validasi zod di semua input, CORS hanya domain web |
| Keandalan | Backup harian bawaan Supabase + export CSV mingguan |
| Analitik | Plausible/Umami (tanpa banner cookie): klik "Pesan", kata kunci cari, kata kunci tidak ketemu |

## 8. Jadwal kasar

| Fase | Isi | Perkiraan |
|---|---|---|
| 0 | Setup monorepo, Supabase, desain token, foto toko, import data awal | 1 minggu |
| 1 | Katalog, pencarian, kategori | 2 minggu |
| 2 | Pesan via WA, info toko, SEO | 1,5 minggu |
| 3 | Login pemilik, kelola barang, pesanan masuk, pegawai | 2,5 minggu |
| 4 | Favorit, riwayat, pesan ulang | 1 minggu |

## 9. Risiko

| Risiko | Mitigasi |
|---|---|
| Harga di web tidak diperbarui → pelanggan kecewa | Mode "ubah harga cepat", label "harga dikonfirmasi toko", tanggal "diperbarui" di detail barang |
| Foto barang belum ada | Placeholder inisial yang rapi; foto bertahap dari panel lewat kamera HP |
| Data awal ratusan barang | Template Excel + import di Fase 0 |
| Spam pesanan lewat API | Rate limit + honeypot field |

## 10. Yang perlu dari pemilik toko

1. Alamat lengkap, titik Google Maps, jam buka, hari libur.
2. Nomor WhatsApp untuk pesanan.
3. Jenis barang utama yang dijual + daftar barang & harga (Excel/foto buku harga).
4. Foto papan nama / logo (untuk warna aksen), dan izin foto suasana toko.
5. Nama domain yang diinginkan (mis. `tokonewagung.com`).
