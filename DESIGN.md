---
name: Etalase
description: Fondasi desain Toko New Agung. Etalase belanja gaya marketplace (Tokopedia, Shopee, Lazada) yang padat dan bisa dipercaya, untuk pembeli di HP, dengan warna dan foto toko sendiri.
version: 3.0.0
source_of_truth: apps/web/app/globals.css
design_read: "Etalase e-commerce gaya marketplace untuk pembeli Makassar yang kebanyakan di HP; bahasa belanja yang padat, akrab, dan mengutamakan kepercayaan; Tailwind v4 + Phosphor Icons + gerak minimal."
dials: { DESIGN_VARIANCE: 3, MOTION_INTENSITY: 3, VISUAL_DENSITY: 7 }
colors:
  light:
    paper: "#F4F5F8"        # latar halaman, abu dingin (lantai keramik, latar logo)
    surface: "#FCFCFD"      # kartu, header, formulir
    sunken: "#ECEEF3"       # bidang foto pengganti, chip, strip info header
    ink: "#14162A"
    ink-muted: "#575C70"
    line: "#E1E4EB"         # garis kartu (dekoratif)
    line-strong: "#C5CAD6"  # garis nota putus-putus
    field: "#82889C"        # garis tepi kontrol, min. 3:1
    brand: "#282C83"        # SATU-SATUNYA warna aksi: tombol, tautan, fokus, pilihan aktif
    brand-hover: "#20246E"
    brand-text: "#282C83"
    brand-tint: "#ECEDF9"
    signal: "#D11D20"       # merah logo = arti PROMO: badge diskon, bagian "Lagi promo"; juga angka keranjang
    signal-text: "#C0181B"  # persen diskon & tautan promo sebagai teks
    signal-tint: "#FCECEC"  # latar bagian "Lagi promo"
    wa: "#1D7F46"           # hanya tombol WhatsApp
    wa-text: "#17703D"
    ok: "#2B7342"
    warn: "#9A5F00"
    danger: "#B4161B"
  dark:
    paper: "#0E1020"
    surface: "#161930"
    sunken: "#1C2038"
    ink: "#E9EAF3"
    ink-muted: "#A0A4BA"
    line: "#272B47"
    line-strong: "#3A3F63"
    field: "#6A7099"
    brand: "#4D53CC"
    brand-hover: "#5A60D8"
    brand-text: "#B4B8FF"
    brand-tint: "#1F2350"
    signal: "#D7322F"
    signal-text: "#FF8A85"
    signal-tint: "#2C1520"
    wa: "#238550"
    wa-text: "#5CC27E"
    ok: "#5CC27E"
    warn: "#E0A640"
    danger: "#FF7A7A"
  banner-scrim:             # tetap, tidak ikut mode gelap (teks putih di atas foto)
    brand: "#282C83"
    signal: "#B4161B"
    ink: "#14162A"
typography:
  families:
    sans: "'Plus Jakarta Sans Variable', system-ui, sans-serif"   # Tokotype (Indonesia), OFL-1.1, self-hosted
    mono: "'IBM Plex Mono', ui-monospace, monospace"              # OFL-1.1, 500, hanya kode pesanan
  roles:
    banner:     { size: "20px / 30px (≥640) / 38px (≥1024)", weight: 800, tracking: "-0.02em", line-height: 1.15 }
    section:    { size: "18px / 20px (≥640)", weight: 700, tracking: "-0.015em" }
    page-title: { size: "22px / 26px (≥640)", weight: 700 }
    product-title: { size: "20px / 24px (≥640)", weight: 700 }
    body:       { size: "14-15px", line-height: 1.6, max-width: "65ch" }
    card-name:  { size: "13px / 14px (≥640)", weight: 400, line-height: 1.35, lines: "selalu 2 baris (min-height 2.7em)" }
    price:      { weight: 700, numeric: tabular-nums, tracking: "-0.02em", currency: "Rp 0.62em naik 0.38em", size: "16-17px kartu / 30-34px detail / 20px subtotal" }
    meta:       { size: "11-12px", color: ink-muted, note: "satuan, harga coret, Dibeli Nx, merek" }
    code:       { family: mono, weight: 500 }
rounded:
  control: 12px    # --radius-tag: tombol, input, kartu barang, kartu bagian
  media: 20px      # --radius-media: banner, bagian promo, lembar filter HP, peta
  badge: 6px       # badge diskon
  pill: 9999px     # chip, tab urutan, titik banner, status
spacing:
  container: 1280px
  gutter: 16px
  card-gap: "10px (HP) / 12px"
  touch-target: "44px (h-11 atau .tap); titik banner 24px (WCAG 2.2 AA)"
  section-gap: "32px (HP) / 40px (≥768)"
elevation:
  card: none           # datar, garis 1px
  card-hover: "0 10px 28px -16px rgb(shadow-tint / .28)"
  popover: "0 12px 32px -16px rgb(shadow-tint / .35)"   # saran pencarian, dialog
motion:
  control: "150ms cubic-bezier(0.16,1,0.3,1): warna, garis, bayangan; tekan scale(0.98)"
  banner: "berganti tiap 6 detik (scroll-snap + scrollTo smooth); berhenti saat disorot/difokus/tab tersembunyi; mati untuk reduced-motion"
  reduced-motion: "semua durasi 0, banner tidak berganti sendiri"
components:
  buttons:        { css: ".btn .btn-primary .btn-secondary .btn-wa .btn-lg" }
  chip:           { css: ".chip" }
  card:           { css: ".card .card-hover" }
  tap-target:     { css: ".tap" }
  header:         { file: apps/web/components/SiteHeader.tsx }
  banner:         { file: apps/web/components/BannerCarousel.tsx }
  product-card:   { file: apps/web/components/ProductCard.tsx, exports: "ProductCard ProductRow ProductGrid DiscountBadge soldLabel" }
  catalog:        { file: apps/web/components/Catalog.tsx, mobile: apps/web/components/FilterSheet.tsx, params: apps/web/lib/catalog-params.ts }
  product-buy:    { file: apps/web/components/ProductPurchase.tsx }
  product-image:  { file: apps/web/components/ProductImage.tsx, icons: apps/web/components/CategoryIcon.tsx }
  price-tag:      { file: apps/web/components/Price.tsx }
  receipt:        { file: apps/web/components/CartView.tsx }
  map:            { file: apps/web/components/MapEmbed.tsx }
  dialog:         { file: apps/web/components/panel/Dialog.tsx }
icons: "@phosphor-icons/react (ssr di Server Component), bobot regular/bold, fill untuk ikon judul bagian & status aktif, duotone untuk ikon kategori"
---

# Etalase v3

Fondasi desain untuk etalase online Toko New Agung Alat Tulis & Kantor (Jl. DR. Ratulangi No.52, Makassar) dan panel pemiliknya. Sumber kebenaran token ada di `apps/web/app/globals.css`, dan rencana produk ada di `docs/PRD.md`.

## Ikhtisar

**Bacaan desain:** etalase e-commerce gaya marketplace untuk pembeli Makassar yang kebanyakan memakai HP. Klien meminta beranda yang berisi promo, barang baru, dan barang yang sering dibeli, dengan tampilan barang seperti Tokopedia, Shopee, Lazada, dan HnD Computer. Pembeli sudah terbiasa dengan pola itu, jadi pola yang akrab lebih penting daripada keunikan.

- **Dial:**
  - **VARIANCE 3:** grid simetris dan berulang, supaya rak mudah dipindai.
  - **MOTION 3:** hanya umpan balik kontrol dan banner yang bergeser.
  - **DENSITY 7:** banyak barang per layar (2 kolom di HP, 5-6 di layar lebar), info ringkas.
- **Panel pemilik** adalah dashboard. Tata letaknya tidak diubah, hanya ikut token.

**Pengecualian yang disengaja** dari aturan umum, karena memang konvensi belanja online:

- Teks di atas foto banner, dengan scrim gradien warna tetap supaya kontrasnya terjamin.
- Badge diskon di pojok foto barang.
- Carousel banner di beranda.

**Bukti visual dari toko sendiri:**

- **Logo.** Biru `#282C83`, merah `#D11D20`, latar `#E3E4E6`.
- **Tiga foto interior**, dipakai dengan izin pemilik sebagai foto banner bawaan:

| Berkas | SHA-256 |
|---|---|
| `apps/web/public/foto/lorong-kertas.webp` | `ddc99c7cad97f0543504b8b66ea15692cf4aa671518515499e33c17a5c5e4588` |
| `apps/web/public/foto/papan-lorong.webp` | `0ac8b21826d8d54d89d1a2b1682b99d580645c681c46ae2e917e88e165666a20` |
| `apps/web/public/foto/etalase-kalkulator.webp` | `b59834aae77e69da97e27f93ca7b83501014628807082db4ee397788692df977` |

- **Profil Google Maps:** rating 4,5 dari 10.466 ulasan.
- **Konfirmasi pemilik:** WhatsApp 0823-4848-5101, buka setiap hari 05.00-22.00 WITA, domain `newagung.com`.

## Catatan kurasi (v2 ke v3)

| Aspek | v2 "Papan Lorong" | v3 "Etalase" |
|---|---|---|
| Beranda | Tentang toko: hero foto, fakta, bento, alur, papan lorong | Banner promo, grid ikon kategori, rak "Lagi promo", "Paling sering dibeli", "Baru masuk rak", "Pilihan toko", merek, lalu info toko ringkas di bawah |
| Kartu barang | Berjarak di dalam kartu, merek di atas, harga + tombol | Foto penuh di atas, badge diskon, nama 2 baris, harga tebal, harga coret + persen, "Dibeli Nx" |
| Katalog | Chip kategori + select urutan | Kolom filter kiri (kategori, penawaran, merek, rentang harga), tab urutan, chip filter aktif; di HP lembar "Filter" dari bawah |
| Detail barang | 2 kolom | 3 kolom: foto, info, kotak "Atur jumlah" yang menempel (subtotal, "+ Keranjang", "Beli langsung"); di HP bilah beli di bawah layar |
| Header | Satu baris, menu teks | Strip info toko, kotak cari besar dengan tombol "Cari", pintasan di bawahnya, favorit, keranjang |
| Merah | Hanya angka keranjang & hapus | Arti "promo/diskon" (tetap bukan warna tombol) |
| Kontainer | 1152px | 1280px |
| Ciri khas | Papan lorong gantung | Dihapus. Kategori memakai ikon bulat seperti marketplace |
| Gerak | Masuk berurutan, muncul saat discroll | Dihapus. Hanya banner yang bergeser |

**Dipertahankan:**

- Warna logo, latar abu dingin, foto toko asli, dan Plus Jakarta Sans.
- Nota keranjang, alur pesanan WhatsApp, dan time picker jam ambil.
- Semua rute.

**Dikecualikan:**

- Spanduk dan nomor Printech, wajah pelanggan, foto stok, dan ilustrasi.
- Angka "terjual" palsu. "Dibeli Nx" hanya dihitung dari pesanan yang sudah diproses toko (status disiapkan/siap/selesai, 180 hari terakhir), dan bagian "Paling sering dibeli" baru muncul bila angkanya ada.
- Timer hitung mundur "flash sale" dan stok "tinggal 2!" buatan. Promo hanya tampil bila pemilik mengisi harga coret.

## Warna dan status semantik

**Biru merek** adalah satu-satunya warna aksi:

- tombol utama ("+ Keranjang", "Cari", "Lihat N barang"), tombol "+" di kartu;
- tautan dan "Lihat semua";
- cincin fokus;
- tab urutan, chip filter, varian, dan satuan yang dipilih.

**Merah** artinya promo:

- badge persen di foto barang;
- persen di bawah harga;
- latar `signal-tint` bagian "Lagi promo";
- tautan pintasan "Lagi promo".

Merah juga dipakai untuk angka di ikon keranjang dan untuk konfirmasi hapus di panel. **Merah tidak pernah menjadi warna tombol beli.**

**Hijau** hanya untuk aksi WhatsApp.

Status selalu ditulis dengan kata: "Ada", "Sisa sedikit", "Stok habis". Harga coret memakai `<s>` dengan teks tersembunyi "Harga normal", dan badge memakai teks tersembunyi "Diskon", jadi warna tidak pernah menjadi satu-satunya penanda.

Kontras terukur (WCAG 2.x: teks ≥ 4,5:1, garis kontrol ≥ 3:1):

| Pasangan | Terang | Gelap |
|---|---|---|
| `ink` di `paper` | 16,35 | 15,74 |
| `ink-muted` di `paper` / `sunken` | 6,08 / 5,71 | 7,65 / 6,48 |
| Putih di `brand` (tombol utama) | 11,81 | 6,13 |
| `brand-text` di `paper` | 10,83 | 10,09 |
| Putih di `signal` (badge diskon) | 5,37 | 4,79 |
| `signal-text` di `surface` / `signal-tint` | 6,05 / 5,42 | 7,59 / 7,47 |
| `ink-muted` di `signal-tint` | 5,79 | 6,89 |
| Putih di scrim banner (brand / signal / ink) | 11,81 / 6,84 / 17,83 | sama |
| Putih di `wa` (tombol WhatsApp) | 5,03 | 4,62 |
| `ok` / `warn` / `danger` di `surface` | 5,64 / 5,11 / 6,67 | 7,79 / 7,98 / 6,84 |
| `field` (garis kontrol) di `surface` / `paper` / `sunken` | 3,44 / 3,24 / 3,04 | 3,61 / 3,94 / 3,34 |

Satu tema mengikuti `prefers-color-scheme`. Logo di mode gelap diletakkan di atas plat `#E3E4E6`.

## Tipografi

**Plus Jakarta Sans Variable** (Tokotype, OFL-1.1) di-host sendiri dari `@fontsource-variable/plus-jakarta-sans`. **IBM Plex Mono 500** hanya untuk kode pesanan. Tidak ada serif. Ukuran per peran ada di frontmatter. Harga selalu memakai `Price` (angka tabular, "Rp" kecil terangkat).

## Tata letak

Kontainer 1280px (`max-w-7xl`) dengan gutter 16px. Breakpoint: 640, 768, 1024, dan 1280px.

**Header** (menempel di atas):

- **Strip info (≥768px).** Alamat ambil di toko, status buka, "Tentang toko", dan nomor WhatsApp.
- **Baris utama.**
  - Logo.
  - "Kategori" (≥1024px).
  - Kotak cari selebar mungkin dengan tombol "Cari".
  - Pintasan di bawah kotak cari: Lagi promo, Terlaris, Baru masuk, dan 5 kategori dari API (≥1024px).
  - Favorit dan Keranjang.
- **Di HP.** Kotak cari di baris kedua, dan navigasi bawah (Beranda, Kategori, Favorit, Keranjang). Navigasi bawah disembunyikan di halaman barang, diganti bilah beli.

**Beranda**, dari atas ke bawah:

1. **Banner.** Rasio 16:8 (HP), 16:6 (≥640), 16:5 (≥1024). Isinya dari panel "Banner beranda", dengan foto toko bila kosong. Teks selalu di kiri di atas scrim gradien.
2. **Kartu "Kategori".** Ikon bulat `brand-tint` dengan nama kategori. "Lagi promo" ada di urutan pertama dengan ikon bulat `signal-tint`.
3. **"Lagi promo".** Bidang `signal-tint` beradius 20px, diurutkan dari diskon terbesar.
4. **"Paling sering dibeli".** Hanya tampil bila ada barang dengan angka dibeli lebih dari 0.
5. **"Baru masuk rak"** dan **"Pilihan toko"** (barang yang ditandai pemilik).
6. **"Merek di rak".** Chip dengan jumlah barang.
7. **"Belanja dari HP, ambil di toko".** 3 langkah, dan 4 fakta toko (jam, Google, alamat, WhatsApp).

Setiap rak berisi 6 kartu: digeser dengan snap di HP (kartu 152px), dan 6 kolom di ≥1024px. Judul rak memakai ikon bulat, judul, catatan kecil, dan "Lihat semua" di kanan.

**Katalog, kategori, merek, dan cari** memakai komponen yang sama, `Catalog`:

- **Kolom filter kiri** 232px (≥1024px):
  - kategori, dengan sub-kategori terbuka untuk kategori aktif;
  - "Penawaran": Lagi promo, Pilihan toko;
  - merek: 8 teratas, sisanya di "Lihat N merek lain";
  - rentang harga: form GET.
- **Di HP**, tombol "Filter" dengan jumlah filter aktif membuka lembar dari bawah (`<dialog>`), dengan tombol "Lihat N barang".
- **Tab urutan** berupa chip: Paling sesuai (hanya di cari), Terbaru, Terlaris, Diskon terbesar (hanya saat promo), Harga terendah, Harga tertinggi.
- **Chip filter aktif** dengan tombol ×, dan "Hapus semua".
- **Grid** 2, 3, 4, lalu 5 kolom (≥1280px).

Semua filter berupa tautan atau form GET, jadi tetap jalan tanpa JavaScript. Nilai URL yang asing dibuang (`lib/catalog-params.ts`). Parameter URL: `merek`, `min`, `max`, `promo=1`, `pilihan=1`, `sort`, `page`.

**Detail barang:**

- **Kolom 1 (340px / 400px).** Foto yang menempel.
- **Kolom 2.** Nama, merek, "Dibeli Nx", stok, dan badge "Pilihan toko". Lalu harga besar, persen dan harga coret, pilihan varian, dan "Beli per" (tiap satuan menampilkan harga, harga per pcs bila lebih hemat, dan badge persen bila promo). Terakhir keterangan dan info ambil di toko.
- **Kolom 3 (280-300px), "Atur jumlah".** Stepper, stok, subtotal, "+ Keranjang" (utama), "Beli langsung" (garis biru; masuk keranjang lalu membuka keranjang), dan "Tanya dulu via WhatsApp".
- **Di HP dan tablet.** Jumlah dan subtotal ada di kolom info, dan bilah bawah berisi WhatsApp, "Beli langsung", dan "+ Keranjang".
- Satuan awal adalah satuan yang sedang promo, supaya harga sama dengan di kartu.

**Keranjang dan footer** tidak berubah dari v2: nota yang menempel, time picker jam ambil, dan peta.

## Bentuk dan elevasi

| Radius | Dipakai untuk |
|---|---|
| 12px | Kontrol, kartu barang, kartu bagian, kotak "Atur jumlah" |
| 20px | Banner, bidang "Lagi promo", lembar filter HP, peta, kartu kosong |
| 6px | Badge diskon |
| Pill | Chip, tab urutan, titik banner, status |

Foto di kartu barang menempel penuh ke tepi kartu, tanpa radius sendiri. Kartu **datar** dengan garis `line` 1px, dan bayangan tipis hanya saat disorot. Tidak ada glow atau bayangan hitam murni.

## Interaksi dan gerak

- **Kontrol.** 150ms; tombol mengecil `scale(0.98)` saat ditekan.
- **Banner.**
  - Geser dengan jari (scroll-snap), dengan tombol panah (muncul saat disorot, ≥768px), atau dengan titik (24×24px, tidak saling tumpuk).
  - Berganti tiap 6 detik, kecuali saat disorot atau difokus, saat tab tidak terlihat, atau bila `prefers-reduced-motion` aktif.
- **Tombol "+" di kartu.** Berubah menjadi centang hijau selama 1,4 detik, dan diumumkan lewat `role="status"`.
- **Lembar filter HP.** Tertutup sendiri saat filter dipilih, harga diterapkan, latar diklik, atau Esc ditekan.
- **Fokus.** `:focus-visible` 2px `brand-text` dengan offset 2px.

## Kontrak komponen

| Komponen | Slot |
|---|---|
| Kartu barang | foto penuh atau ikon jenis barang, badge diskon (kiri atas), favorit (kanan atas), label "Stok habis" di tengah foto, nama 2 baris, "mulai" bila harga varian berbeda, harga, satuan, harga coret + persen, baris meta ("Sisa sedikit" > "Dibeli Nx" > merek), "+" untuk barang satu varian |
| Banner | foto (opsional), scrim tema (brand / signal / ink), judul ≤ 80 karakter, keterangan ≤ 140, tombol semu "Lihat sekarang" (≥640px), tautan ke halaman di situs ini |
| Judul rak | ikon bulat (brand-tint, atau signal untuk promo), judul, catatan, "Lihat semua" |
| Tombol | `.btn` + peran (`-primary`, `-secondary`, `-wa`), opsional `.btn-lg`; label tidak pernah pecah baris |
| Chip | `.chip`; aktif lewat `aria-current` atau `aria-pressed` |
| Nota keranjang | total, garis putus-putus, nama, cara terima, jam ambil, tombol WhatsApp |
| Dialog panel | judul berisi nama objek, akibat, "Batal", aksi berlabel kata kerja + objek |

## Data di balik tampilan

- **Harga coret.** Kolom `original_price` per satuan, diisi di panel ("Harga coret") atau lewat import (`harga_coret`).
  - Database menolak harga coret yang tidak lebih besar dari harga jual.
  - Harga coret dilepas otomatis bila harga dinaikkan melewatinya.
- **Kartu barang** menampilkan satuan dengan diskon terbesar.
- **Pilihan toko.** Centang "Pilihan toko" di form barang.
- **Banner.** Panel → "Banner beranda", dengan jadwal mulai dan selesai (WITA).
- **Dibeli.** View `product_sales`.

## Yang dilakukan dan yang dihindari

* Lakukan: biru untuk aksi, merah untuk promo, hijau untuk WhatsApp. Jangan ditukar.
* Lakukan: tulis status dengan kata, dan jaga target sentuh minimal 44px (24px untuk titik banner).
* Lakukan: tampilkan promo dan "Dibeli" hanya dari data sungguhan.
* Lakukan: pakai foto asli toko atau barang; bila belum ada, pakai ikon jenis barang (`CategoryIcon`).
* Hindari: em-dash (—) dan en-dash (–) di teks apa pun. Pakai tanda hubung biasa.
* Hindari: hitung mundur palsu, stok "tinggal sedikit" buatan, dan angka terjual karangan.
* Hindari: SVG ikon buatan tangan. Pakai Phosphor.
* Hindari: glow, krem/kuningan, serif, foto stok, dan teks di atas foto tanpa scrim.
* Hindari: `confirm()`/`prompt()` bawaan browser. Pakai `useDialog()`.
* Lakukan: bila token di `globals.css` berubah, perbarui dokumen ini di commit yang sama.
