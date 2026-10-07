---
name: Papan Lorong
description: Fondasi desain Toko New Agung. Etalase toko ATK yang bersih dan ramah untuk pembeli di HP, dengan papan lorong gantung sebagai navigasi kategori.
version: 2.0.0
source_of_truth: apps/web/app/globals.css
design_read: "Redesign (visual overhaul, isi & struktur dipertahankan) untuk etalase toko ATK lokal, pembeli Makassar yang kebanyakan di HP; bahasa ritel yang bersih, ramah, dan bisa dipercaya; Tailwind v4 + Phosphor Icons + gerak CSS yang ditahan."
dials: { DESIGN_VARIANCE: 5, MOTION_INTENSITY: 4, VISUAL_DENSITY: 4 }
colors:
  light:
    paper: "#F4F5F8"        # latar halaman, abu dingin (lantai keramik, latar logo)
    surface: "#FCFCFD"      # kartu, header, formulir
    sunken: "#ECEEF3"       # bidang foto pengganti, chip, segmen
    ink: "#14162A"
    ink-muted: "#575C70"
    line: "#E1E4EB"         # garis kartu (dekoratif)
    line-strong: "#C5CAD6"  # garis nota putus-putus, penghubung alur
    field: "#82889C"        # garis tepi kontrol, min. 3:1
    brand: "#282C83"        # SATU-SATUNYA aksen: aksi utama, tautan, fokus, pilihan aktif
    brand-hover: "#20246E"
    brand-text: "#282C83"
    brand-tint: "#ECEDF9"
    signal: "#D11D20"       # merah logo: hanya angka keranjang, status pesanan baru, konfirmasi hapus
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
    wa: "#238550"
    wa-text: "#5CC27E"
    ok: "#5CC27E"
    warn: "#E0A640"
    danger: "#FF7A7A"
typography:
  families:
    sans: "'Plus Jakarta Sans Variable', system-ui, sans-serif"   # Tokotype (Indonesia), OFL-1.1, self-hosted
    mono: "'IBM Plex Mono', ui-monospace, monospace"              # OFL-1.1, 500, hanya kode pesanan
  roles:
    hero:      { size: "36px / 44px (≥640) / 50px (≥1024)", weight: 800, tracking: "-0.035em", line-height: 1.06, lines: "tepat 2 baris" }
    section:   { size: "28px (bagian utama) / 22px (cuplikan katalog)", weight: 700, tracking: "-0.025em" }
    page-title: { size: "26-32px", weight: 700 }
    body:      { size: "16-17px", line-height: 1.625, max-width: "44-60ch" }
    card-name: { size: "14px", weight: 500, line-height: 1.375 }
    price:     { weight: 700, numeric: tabular-nums, tracking: "-0.02em", currency: "Rp 0.62em naik 0.38em", size: "17-19px kartu / 36-40px detail / 30px nota" }
    signage:   { weight: 700, transform: uppercase, tracking: "0.04em", note: "hanya di papan lorong" }
    code:      { family: mono, weight: 500 }
rounded:
  control: 12px    # --radius-tag: tombol, input, kartu, nota
  media: 20px      # --radius-media: foto besar, bento, kartu kosong, peta
  sign: 6px        # --radius-sign: papan lorong
  inner: 10px      # foto di dalam kartu, ikon tombol kecil
  pill: 9999px     # chip, badge, status
spacing:
  container: 1152px
  gutter: 16px
  touch-target: 44px   # nyata (h-11/h-12) atau area .tap
  section-gap: "64px (HP) / 80px (≥768)"
elevation:
  card: none           # datar, garis 1px
  card-hover: "0 10px 28px -16px rgb(shadow-tint / .28)"
  popover: "0 12px 32px -16px rgb(shadow-tint / .35)"   # saran pencarian, dialog
motion:
  control: "150ms cubic-bezier(0.16,1,0.3,1): warna, garis, bayangan; tekan scale(0.98)"
  hero-entry: "rise 640ms berurutan (70ms per elemen): status, judul, teks, tombol"
  section-reveal: "CSS scroll-driven (animation-timeline: view()), tanpa listener JS"
  sign-swing: "rotate(-1.2deg) 220ms, poros di tali"
  reduced-motion: "semua mati, isi langsung tampil"
components:
  buttons:        { css: ".btn .btn-primary .btn-secondary .btn-wa .btn-lg" }
  chip:           { css: ".chip" }
  card:           { css: ".card .card-hover" }
  tap-target:     { css: ".tap" }
  aisle-sign:     { file: apps/web/components/AisleSigns.tsx, css: ".aisle-rail .aisle-sign" }
  product-card:   { file: apps/web/components/ProductCard.tsx }
  product-image:  { file: apps/web/components/ProductImage.tsx, icons: apps/web/components/CategoryIcon.tsx }
  price-tag:      { file: apps/web/components/Price.tsx }
  receipt:        { file: apps/web/components/CartView.tsx }
  map:            { file: apps/web/components/MapEmbed.tsx }
  dialog:         { file: apps/web/components/panel/Dialog.tsx }
icons: "@phosphor-icons/react (ssr di Server Component), bobot regular/bold, fill untuk status aktif"
---

# Papan Lorong v2

Fondasi desain untuk etalase online Toko New Agung Alat Tulis & Kantor (Jl. DR. Ratulangi No.52, Makassar) dan panel pemiliknya. Sumber kebenaran token ada di `apps/web/app/globals.css`, dan rencana produk ada di `docs/PRD.md`.

## Ikhtisar

**Bacaan desain:** redesign untuk etalase toko ATK lokal, dengan pembeli Makassar yang kebanyakan memakai HP (orang tua, pelajar, kantor). Bahasanya ritel yang bersih, ramah, dan bisa dipercaya.

- **Mode redesign:** visual dirombak, sedangkan isi, rute, label menu, logo, warna merek, dan alur pemesanan dipertahankan.
- **Dial:**
  - **VARIANCE 5:** asimetris secukupnya, karena katalog harus mudah dipindai.
  - **MOTION 4:** transisi, masuk berurutan di pembuka, muncul saat discroll.
  - **DENSITY 4:** lega, tapi rak barang tetap padat.
- **Panel pemilik** adalah dashboard, jadi tata letaknya tidak diubah. Panel hanya ikut token: font, warna, radius, tombol, dan ikon.

Bukti visualnya berasal dari toko sendiri:

- **Logo.** Sampel warnanya: biru `#282C83`, merah `#D11D20`, latar `#E3E4E6`.
- **Tiga foto interior**, dipakai dengan izin pemilik dan dipotong tanpa wajah pelanggan yang jelas:

| Berkas | SHA-256 |
|---|---|
| `apps/web/public/foto/lorong-kertas.webp` | `ddc99c7cad97f0543504b8b66ea15692cf4aa671518515499e33c17a5c5e4588` |
| `apps/web/public/foto/papan-lorong.webp` | `0ac8b21826d8d54d89d1a2b1682b99d580645c681c46ae2e917e88e165666a20` |
| `apps/web/public/foto/etalase-kalkulator.webp` | `b59834aae77e69da97e27f93ca7b83501014628807082db4ee397788692df977` |

- **Profil Google Maps:** rating 4,5 dari 10.466 ulasan.
- **Konfirmasi pemilik:**
  - WhatsApp 0823-4848-5101.
  - Buka setiap hari 05.00-22.00 WITA.
  - Domain `newagung.com`.

**Ciri khas: Papan Lorong.** Papan putih bertali yang tergantung dari rel biru, meniru papan di lorong toko. Papan Lorong adalah navigasi kategori, bukan hiasan, dan merupakan satu-satunya elemen yang "berani". Elemen lain dibuat tenang.

## Catatan kurasi (v1 ke v2)

**Dipertahankan.**
- Papan Lorong, warna logo, latar abu dingin (bukan krem), dan foto toko asli.
- Nota dengan garis putus-putus, harga dengan angka tabular, dan alur pemesanan WhatsApp.
- Semua rute dan label menu.

**Diubah.**

| Aspek | v1 | v2 |
|---|---|---|
| Font | Archivo dengan lebar sempit di banyak tempat | Plus Jakarta Sans, buatan foundry Indonesia, lebih ramah dibaca. Gaya kapital hanya tersisa di papan lorong. |
| Warna aksi | Merah untuk tombol utama, biru untuk struktur, hijau untuk WhatsApp (tiga warna bersaing) | Satu aksen biru merek untuk semua aksi utama; merah hanya untuk angka keranjang dan konfirmasi hapus; hijau hanya untuk WhatsApp |
| Radius | 4px kotak | Kontrol dan kartu 12px, media 20px, chip pill |
| Ikon | SVG digambar tangan | Phosphor Icons |
| Kartu barang | Grid garis bersama dengan blok abu besar bertuliskan nama | Kartu berjarak dengan foto atau ikon jenis barang di bidang lembut |
| Beranda | Tiga bagian foto+teks berturut-turut, tagline di bawah tombol hero | Enam pola tata letak berbeda; hero tepat 4 elemen |
| Tanda baca | Em-dash dan en-dash di jam buka, pesan WhatsApp, judul | Tanda hubung biasa (`05.00-22.00`) |
| Garis tepi kontrol | 1,6:1 | Token `field` ≥ 3:1 (WCAG 1.4.11) |

**Dikecualikan.**
- Spanduk dan nomor Printech, wajah pelanggan, dan logo merek pihak ketiga sebagai hiasan.
- Teks ulasan Google, foto stok, ilustrasi, gradien, glassmorphism, dan carousel banner.
- Label nomor bagian, eyebrow di atas setiap judul, dan bahasa iklan.

## Warna dan status semantik

Satu aksen: **biru merek**. Biru dipakai untuk:
- tombol utama ("Lihat katalog", "Masukkan keranjang");
- tombol "+" di kartu;
- tautan;
- cincin fokus;
- chip, varian, dan satuan yang sedang dipilih;
- titik alur "Belanja dari HP".

**Merah sinyal** hanya untuk angka di ikon keranjang, status pesanan "Baru" di panel, dan tombol konfirmasi hapus/batal di dialog. **Hijau** hanya untuk aksi WhatsApp. Tidak ada token gradien.

Status selalu ditulis dengan kata: "Ada", "Sisa sedikit", "Stok habis", dan "Buka, tutup 22.00". Varian yang habis juga dicoret, jadi warna tidak pernah menjadi satu-satunya penanda.

Kontras terukur (WCAG 2.x: teks ≥ 4,5:1, garis kontrol ≥ 3:1):

| Pasangan | Terang | Gelap |
|---|---|---|
| `ink` di `paper` | 16,35 | 15,74 |
| `ink-muted` di `paper` / `sunken` | 6,08 / 5,71 | 7,65 / 6,48 |
| Putih di `brand` (tombol utama) | 11,81 | 6,13 |
| `brand-text` di `paper` | 10,83 | 10,09 |
| Putih di `signal` (badge) | 5,37 | 4,79 |
| Putih di `wa` (tombol WhatsApp) | 5,03 | 4,62 |
| `wa-text` di `paper` / `surface` | 5,63 | 7,79 |
| `ok` / `warn` / `danger` di `surface` | 5,64 / 5,11 / 6,67 | 7,79 / 7,98 / 6,84 |
| `field` (garis kontrol) di `surface` / `paper` / `sunken` | 3,44 / 3,24 / 3,04 | 3,61 / 3,94 / 3,34 |

Halaman memakai **satu tema** mengikuti `prefers-color-scheme`, dan tidak ada bagian yang membalik warna di tengah halaman. Tidak ada `#000` atau `#fff` murni. Logo di mode gelap diletakkan di atas plat `#E3E4E6`.

## Tipografi dan lisensi font

**Plus Jakarta Sans Variable** dipakai untuk seluruh teks UI. Font ini dari Tokotype (Indonesia), berlisensi SIL OFL-1.1, dan di-host sendiri dari paket npm `@fontsource-variable/plus-jakarta-sans` 5.3.0, jadi tidak ada hotlink Google Fonts.

| Peran | Ukuran | Gaya |
|---|---|---|
| Judul hero | 36px, 44px (≥640), 50px (≥1024) | 800, tracking −0,035em, **tepat 2 baris** (dua `span` blok) |
| Judul bagian utama | 28px | 700, tracking −0,025em |
| Judul cuplikan katalog | 22px | 700 |
| Teks | 16-17px | line-height 1,625, maks. 44-60ch |
| Nama barang di kartu | 14px | 500 |
| Harga | 17-19px kartu, 36-40px detail, 30px nota | 700, angka tabular, "Rp" kecil terangkat |
| `signage` | - | 700, kapital, tracking 0,04em; **hanya** di papan lorong |

**IBM Plex Mono 500** (OFL-1.1) dipakai hanya untuk kode pesanan. Tidak ada serif. Teks di SVG logo hanya ada di logo; ganti dengan file vektor asli bila tersedia.

## Tata letak dan perilaku responsif

Kontainer 1152px dengan gutter 16px. Breakpoint: 640, 768, dan 1024px. Target sentuh minimal 44×44px, baik dengan ukuran sebenarnya (`h-11`/`h-12`) maupun dengan `.tap` yang memperluas area sentuh tanpa mengubah tampilan.

**Header.** Tinggi 64px di HP dan 72px di layar ≥768px, dalam satu baris:
- logo;
- kotak cari (≥768px);
- menu Katalog, Kategori, Tentang toko, Favorit (≥1024px);
- status buka (≥1280px);
- tombol Keranjang dengan badge.

Di HP, kotak cari pindah ke baris kedua (48px), dan navigasi ada di bawah (64px: Beranda, Kategori, Favorit, Keranjang) dengan ikon terisi untuk halaman aktif.

**Beranda.** Enam bagian dengan pola tata letak berbeda:
1. **Pembuka terbelah.** Teks di kiri, foto lorong kertas di kanan, radius 20px. Isinya tepat 4 elemen: pill status buka, judul 2 baris, subteks ≤ 20 kata, serta "Lihat katalog" dan "Rute ke toko".
2. **Baris fakta.** Satu lajur dengan pembatas tipis, tanpa kartu. Isinya jam buka, rating Google, alamat, dan WhatsApp, masing-masing dengan ikon dalam lingkaran `brand-tint`. Di HP ditumpuk.
3. **Bento "Di dalam toko".** Tepat 4 sel dalam 2 baris berirama: [teks + "Tentang toko" | foto papan lorong 2:1], lalu [foto etalase 2:1 | merek di rak berlatar `brand-tint`].
4. **"Belanja dari HP".** Alur 4 langkah berikon dalam lingkaran biru, tersambung garis: horizontal di layar ≥1024px, vertikal di HP. Judul langkahnya adalah kata kerja itu sendiri, tanpa "Langkah 1".
5. **"Pilih lorong".** Lima Papan Lorong dengan barang terbanyak dalam satu rel.
6. **"Baru masuk rak".** Lima kartu dalam satu baris: di HP digeser dengan snap, di ≥1024px 5 kolom.

**Katalog, kategori, dan merek.** Grid 2, 3, lalu 5 kolom dengan jarak 12-16px. Filter memakai `.chip`, dan urutan memakai select.

**Detail barang.** Foto di kartu media 20px yang menempel saat discroll pada layar ≥768px. Di sebelahnya: merek, nama, deskripsi, pemilih varian (lingkaran warna atau tombol teks), satuan sebagai segmen di atas `sunken`, harga besar, stepper 52px, dan "Masukkan keranjang". Di bawahnya tiga baris info berikon (ambil/antar, harga diperbarui, tanya lewat WhatsApp), lalu baris rak "Satu rak dengan barang ini".

**Keranjang.** Daftar barang di dalam satu kartu. Setiap baris berisi gambar mini, nama dan harga di atas, lalu stepper 48px dan tombol hapus berikon di bawah. Nota di kanan menempel saat discroll dan berisi total, nama, cara terima (pilihan aktif biru), jam ambil (time picker), dan tombol WhatsApp.

**Footer.** Logo dan nama toko, empat baris berikon (alamat dengan "Rute ke toko", jam, WhatsApp, telepon), dan peta Google Maps beradius 20px.

## Elevasi dan kedalaman

Kartu **datar**: `surface` dengan garis `line` 1px. Bayangan tipis berwarna latar hanya muncul saat kartu disorot, dan pada saran pencarian serta dialog. Header dan navigasi bawah memakai `surface` 90-95% dengan blur latar. Tidak ada glow atau bayangan hitam murni.

## Bentuk

Satu aturan radius yang terdokumentasi:

| Radius | Dipakai untuk |
|---|---|
| 12px | Kontrol dan kartu |
| 20px | Media besar: foto pembuka, bento, kartu detail, kartu kosong, nota, peta |
| 10px | Foto di dalam kartu, tombol ikon kecil |
| 6px | Papan lorong |
| Pill | Chip, badge, status |

## Interaksi dan gerak

- **Kontrol:** 150ms `cubic-bezier(0.16,1,0.3,1)`; tombol mengecil `scale(0.98)` saat ditekan.
- **Pembuka:** status, judul, teks, dan tombol masuk berurutan (`.rise`, jeda 70ms). Ini memberi hierarki pada momen pertama.
- **Bagian beranda:** muncul saat masuk layar (`.reveal`, CSS `animation-timeline: view()`), tanpa listener scroll JS. Browser tanpa dukungan langsung menampilkan isi.
- **Papan Lorong:** berayun 1,2° saat disorot.
- **Tombol "+":** berubah menjadi centang hijau selama 1,4 detik, diumumkan lewat `role="status"`.
- **Fokus:** `:focus-visible` 2px `brand-text` dengan offset 2px; kotak cari memakai `focus-within`.
- **`prefers-reduced-motion`:** semua durasi menjadi 0 dan isi langsung tampil.

## Kontrak komponen

| Komponen | Slot |
|---|---|
| Papan Lorong | rel, tali (2), nama kategori dengan "&" menjadi "/", jumlah barang, aktif (`aria-current`) |
| Kartu barang | foto atau ikon jenis barang, favorit, merek, nama (2 baris), titik warna (maks. 5 + "+n"), "mulai" di atas harga bila harga varian berbeda, harga, satuan, status stok, aksi ("+" biru untuk satu varian, "Pilih" untuk bervarian) |
| Tombol | `.btn` + peran (`-primary`, `-secondary`, `-wa`), opsional `.btn-lg`; label tidak pernah pecah baris |
| Chip | `.chip`; aktif lewat `aria-current="page"` atau `aria-pressed="true"` |
| Nota keranjang | total, jumlah jenis, garis putus-putus, nama, cara terima, jam ambil (time picker, dibatasi jam buka) atau catatan, galat, tombol WhatsApp, petunjuk |
| Dialog panel | judul berisi nama objek, akibat, input (khusus isian), "Batal", aksi berlabel kata kerja + objek (merah sinyal untuk hapus/batal) |

**Satu label per tujuan, di mana pun letaknya:** "Lihat katalog", "Rute ke toko", "Semua kategori", "Tentang toko".

## Yang dilakukan dan yang dihindari

* Lakukan: pakai biru merek sebagai satu-satunya aksen aksi. Merah hanya untuk sinyal, hijau hanya untuk WhatsApp.
* Lakukan: tulis status dengan kata, dan jaga target sentuh minimal 44px.
* Lakukan: pakai foto asli toko atau barang; bila belum ada, pakai ikon jenis barang (`CategoryIcon`).
* Lakukan: biarkan Papan Lorong menjadi satu-satunya elemen yang berani.
* Lakukan: jaga judul hero tepat 2 baris dan subteks ≤ 20 kata.
* Hindari: em-dash (—) dan en-dash (–) di teks apa pun. Pakai tanda hubung biasa.
* Hindari: eyebrow kapital di atas judul bagian, label nomor bagian, dan tagline di bawah tombol hero.
* Hindari: SVG ikon buatan tangan. Pakai Phosphor.
* Hindari: gradien, glow, krem/kuningan, serif, dan foto stok.
* Hindari: `confirm()`/`prompt()` bawaan browser. Pakai `useDialog()`.
* Lakukan: bila token di `globals.css` berubah, perbarui dokumen ini di commit yang sama.
