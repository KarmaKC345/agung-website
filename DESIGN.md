---
name: Papan Lorong
description: Fondasi desain Toko New Agung — rak ATK yang bisa dibuka dari HP, dengan papan lorong gantung sebagai navigasi dan label harga rak sebagai tokoh utama.
version: 1.1.0
source_of_truth: apps/web/app/globals.css
colors:
  light:
    paper: "#EEF0F4"        # latar halaman — abu dingin (latar logo, lantai keramik)
    surface: "#FFFFFF"      # rak putih: kartu, header, formulir
    sunken: "#E4E7EE"       # pengganti foto, isian tenang
    ink: "#15172B"          # teks utama
    ink-muted: "#5B5F73"    # teks sekunder
    line: "#D6D9E2"         # garis pemisah 1px
    line-strong: "#B9BDCB"  # garis kontrol
    brand: "#282C83"        # biru logo — rel papan lorong
    brand-text: "#282C83"   # biru untuk link & fokus
    brand-tint: "#E3E5F6"   # sorotan pilihan aktif
    accent: "#D11D20"       # merah logo — satu aksi utama per layar
    accent-ink: "#FFFFFF"
    wa: "#1D7F46"           # latar tombol WhatsApp
    wa-text: "#17703D"      # teks/garis WhatsApp
    ok: "#2B7342"
    warn: "#9A5F00"
    danger: "#B4161B"
  dark:
    paper: "#0F1122"
    surface: "#171A31"
    sunken: "#0B0D1B"
    ink: "#E8E9F2"
    ink-muted: "#9DA1B8"
    line: "#2A2E4A"
    line-strong: "#3D4266"
    brand: "#3A3FA8"
    brand-text: "#AEB2FF"
    brand-tint: "#20244A"
    accent: "#D7322F"
    wa: "#238550"
    wa-text: "#5CC27E"
    ok: "#5CC27E"
    warn: "#E0A640"
    danger: "#FF6B6B"
typography:
  families:
    sans: "'Archivo Variable', system-ui, sans-serif"   # OFL-1.1, wdth 62–125, self-hosted
    mono: "'IBM Plex Mono', ui-monospace, monospace"    # OFL-1.1, 500, self-hosted
  roles:
    thesis:   { size: "40px → 52px (≥640)", line-height: 0.95, weight: 800, stretch: "82%", tracking: "-0.015em" }
    page-title: { size: "26–28px", weight: 700 }
    section:  { size: "20px", weight: 700 }
    body:     { size: "15–16px", line-height: "1.5 (paragraf: 1.625)" }
    card-name: { size: "14px", line-height: 1.35 }
    signage:  { size: "12–20px", weight: 700, stretch: "88%", transform: uppercase, tracking: "0.035em", line-height: 1.12 }
    price:    { size: "22px kartu / 40px detail / 30px nota", weight: 750, stretch: "78%", numeric: tabular-nums, tracking: "-0.01em", line-height: 1, currency: "Rp 0.62em, naik 0.42em" }
    code:     { family: mono, weight: 500, size: "15–26px" }
rounded:
  sign: 2px         # --radius-sign
  tag: 4px          # kontrol, input, kartu, bingkai foto
  pill: 9999px      # chip status, chip sub-kategori, badge jumlah
  swatch: 9999px    # titik warna varian, tombol favorit
spacing:
  container: 1152px
  gutter: 16px
  touch-target: 44px  # ukuran nyata, atau area .tap 44×44 di sekitar kontrol yang tampil lebih kecil
  search-height: "48px header / 56px pembuka"
  rail-drop: 26px   # jarak rel ke papan (panjang tali)
breakpoints: { sm: 640px, md: 768px, lg: 1024px }
elevation:
  flat: none
  popover: "0 8px 24px -12px rgb(0 0 0 / 0.25)"   # saran pencarian, dialog
  backdrop: "rgb(15 17 34 / 0.45)"                 # di belakang dialog
  header: "surface 95% + backdrop-blur"
motion:
  control: "150ms ease-out — color, background, border, outline, opacity (semua a/button/input/select)"
  sign-swing: "rotate(-1.2deg) 180ms ease-out, poros di tali"
  quick-add-confirm: 1400ms
  reduced-motion: "semua durasi 0, papan tidak berayun"
components:
  aisle-sign:     { file: apps/web/components/AisleSigns.tsx, css: .aisle-rail .aisle-sign }
  price-tag:      { file: apps/web/components/Price.tsx, css: .price .price-rp }
  product-card:   { file: apps/web/components/ProductCard.tsx }
  product-image:  { file: apps/web/components/ProductImage.tsx }
  variant-picker: { file: apps/web/components/ProductPurchase.tsx }
  receipt:        { file: apps/web/components/CartView.tsx, css: .receipt-rule }
  status-pill:    { file: apps/web/components/StatusPill.tsx }
  search-box:     { file: apps/web/components/SearchBox.tsx }
  panel-shell:    { file: apps/web/components/panel/PanelShell.tsx }
  dialog:         { file: apps/web/components/panel/Dialog.tsx }
  tap-target:     { css: .tap }
---

# Papan Lorong

Fondasi desain toko alat tulis dengan rak nyata sebagai tesis, permukaan putih yang tenang, dan jalur yang terlihat dari lorong ke WhatsApp.

## Ikhtisar

Papan Lorong adalah fondasi desain untuk website Toko New Agung Alat Tulis & Kantor (Jl. DR. Ratulangi No.52, Makassar) dan panel pemiliknya. Fondasi ini berlaku untuk katalog, pencarian, keranjang, pemesanan lewat WhatsApp, serta pengelolaan barang dan pesanan. Rencana produknya ada di `docs/PRD.md`, dan sumber kebenaran token visualnya ada di `apps/web/app/globals.css`.

Buktinya bukan tangkapan layar website lain. Bukti diambil dari toko itu sendiri, dan semuanya diberikan pemilik pada 7 Oktober 2026:

- **Logo** dari profil bisnis. Sampel warnanya: biru segitiga `#282C83`, merah sapuan dan tulisan "AGUNG" `#D11D20`, latar `#E3E4E6`.
- **Profil Google Maps:** alamat, telepon (0411) 850555, rating 4,5 dari 10.466 ulasan.
- **Tiga foto interior** yang disimpan di repositori:

| Berkas | SHA-256 |
|---|---|
| `apps/web/public/foto/lorong-kertas.webp` | `ddc99c7cad97f0543504b8b66ea15692cf4aa671518515499e33c17a5c5e4588` |
| `apps/web/public/foto/papan-lorong.webp` | `0ac8b21826d8d54d89d1a2b1682b99d580645c681c46ae2e917e88e165666a20` |
| `apps/web/public/foto/etalase-kalkulator.webp` | `b59834aae77e69da97e27f93ca7b83501014628807082db4ee397788692df977` |

- **Konfirmasi pemilik:**
  - WhatsApp pesanan 0823-4848-5101.
  - Buka setiap hari 05.00–22.00 WITA.
  - Domain `newagung.com`.
  - Printech tidak ditampilkan.
  - Foto toko boleh dipakai.

Sudut pandang produknya: **barang harus bisa ditemukan secepat berjalan ke lorong yang benar.** Setiap kunjungan bergerak dari *cari / lorong*, ke *rak*, *label harga*, *keranjang*, *nota*, *WhatsApp*, sampai *pesanan di panel*.

Perangkat khasnya adalah **Papan Lorong**: papan putih bertali, berhuruf kapital hitam, yang tergantung dari rel biru. Wujudnya meniru papan gantung di toko ("SPIDOL/STABILO · CAT POSTER/LEM"). Papan Lorong adalah kontrol navigasi kategori yang menunjukkan nama dan jumlah barang. Ia tidak pernah dipakai sebagai hiasan.

## Catatan kurasi

**Dipertahankan.** Elemen yang dipertahankan dari bukti toko:

- Papan gantung putih dengan bingkai hitam, huruf kapital sempit, dan dua tali.
- Biru dan merah logo.
- Rak putih dengan lantai keramik abu dingin dan cahaya neon yang rata.
- Keranjang belanja merah.
- Label harga rak yang tebal dan rapat.
- Nota dengan garis putus-putus.
- Barang ATK yang penuh warna sebagai sumber warna utama halaman.

**Diterjemahkan.**

| Di toko | Di website |
|---|---|
| Papan lorong | Navigasi kategori (`.aisle-sign`), satu rel per baris. Di HP digeser, di layar lebar lima papan per rel. |
| Label harga rak | Peran tipografi `price` (Archivo 78% width, 750, angka tabular, "Rp" kecil terangkat) |
| Keranjang merah | Istilah dan ikon "Keranjang" |
| Nota kasir | Ringkasan keranjang dan kartu pesanan panel dengan `.receipt-rule` |
| Rak penuh barang | Grid rapat 2/3/5 kolom dengan garis pemisah bersama, tanpa celah lebar |
| Huruf "AGUNG" pada logo | Hanya dipakai di SVG logo (`components/Logo.tsx`), tidak menjadi font UI |

**Dikecualikan.**

- **Spanduk dan nomor Printech.**
- **Wajah pelanggan.** Foto dipotong; lorong kertas hanya menampilkan pelanggan dari belakang.
- **Logo merek pihak ketiga sebagai hiasan.** Ini termasuk stand Casio, Snowman, dan e-Print. Nama merek hanya muncul sebagai data barang berupa teks.
- **Teks ulasan Google.** Yang ditampilkan hanya rating dan jumlah ulasan, dengan link ke Google.
- **Foto stok, ilustrasi, dan ikon 3D.**
- **Pola desain umum:**
  - palet krem;
  - gradien;
  - glassmorphism;
  - banner carousel;
  - bahasa iklan seperti "Solusi Terbaik untuk Kebutuhan Anda".

## Warna dan status semantik

Biru logo `#282C83` adalah warna **struktur**: rel papan lorong, link, cincin fokus, dan sorotan pilihan aktif. Merah logo `#D11D20` adalah warna **satu aksi utama per layar**: "Masukkan keranjang", angka di ikon keranjang, dan tombol "+" saat disorot. Hijau `#1D7F46` hanya untuk aksi WhatsApp. Teks dan garis WhatsApp memakai `#17703D` karena `#1D7F46` di atas latar `paper` hanya mencapai 4,41:1. Selebihnya, halaman didominasi `paper`, `surface`, dan foto barang, supaya warna-warni pulpen dan map yang menonjol, bukan UI.

Merah **bukan** warna sekunder bebas. Merah tidak dipakai untuk judul, latar bagian, atau penanda dekoratif. Status stok ditulis dengan kata ("Ada", "Sisa sedikit", "Stok habis") dan warna `ok`/`warn`/`danger`. Varian habis juga dicoret, jadi warna tidak pernah menjadi satu-satunya penanda. Status pesanan di panel memakai chip berlabel teks. "Batal" ditandai dengan coretan, bukan hanya abu.

Kontras terukur (WCAG 2.x, teks normal butuh ≥ 4,5:1):

| Pasangan | Terang | Gelap |
|---|---|---|
| `ink` di `paper` | 15,48 | 15,46 |
| `ink-muted` di `paper` / `surface` | 5,53 / 6,31 | 7,32 / 6,69 |
| `brand-text` di `paper` | 10,35 | 9,44 |
| Putih di `accent` (tombol utama) | 5,37 | 4,79 |
| Putih di `wa` (tombol WhatsApp) | 5,03 | 4,62 |
| `wa-text` di `paper` | 5,38 | 8,43 |
| `ok` / `warn` / `danger` di `surface` | 5,78 / 5,24 / 6,84 | 7,71 / 7,89 / 6,16 |

Mode gelap mengikuti `prefers-color-scheme`. Di mode gelap, logo diletakkan di atas plat `#E3E4E6` (warna latar logo asli) agar segitiga biru tetap terbaca. Fondasi ini **tidak mendefinisikan token gradien**, dan agen tidak boleh membuatnya.

## Tipografi dan lisensi font

Semua teks UI memakai **Archivo Variable**. Sumbu *width* (62–125%) dimanfaatkan untuk membedakan peran tanpa menambah keluarga font:

- **Tesis beranda:** 40px → 52px, line-height 0,95, berat 800, lebar 82%, tracking −0,015em ("Rak New Agung, *dari HP.*").
- **Judul halaman:** 26–28px, 700.
- **Judul bagian:** 20px, 700.
- **Teks:** 15–16px.
- **Nama barang di kartu:** 14px.
- **Peran `signage`:** kapital, lebar 88%, 700, tracking 0,035em. Dipakai di papan lorong dan label kecil seperti "ALAMAT" dan "JAM BUKA".
- **Peran `price`:** lebar 78%, 750, angka tabular. Ukurannya 22px di kartu, 40px di detail, dan 30px di nota. Huruf "Rp" berukuran 0,62em dan terangkat 0,42em.

**IBM Plex Mono 500** hanya untuk kode pesanan (`NA-261007-014`), meniru cetakan struk.

Keduanya berlisensi SIL OFL-1.1 dan di-host sendiri dari paket npm `@fontsource-variable/archivo` 5.3.0 (`wdth.css`) dan `@fontsource/ibm-plex-mono` 5.3.0. Next.js membundelnya, jadi tidak ada hotlink Google Fonts saat runtime. Setiap stack diakhiri keluarga generik.

Teks di SVG logo memakai Georgia/Brush Script bawaan sistem, sehingga tampilannya sedikit berbeda antar perangkat. Ganti dengan file vektor asli (huruf sudah dikonversi ke kurva) bila tersedia.

## Tata letak dan perilaku responsif

Kontainer maksimal 1152px dengan gutter 16px.

**Beranda:**
- Di layar ≥768px, bagian pembuka dibagi dua: tesis dan kotak cari besar di kiri, foto lorong kertas di kanan (tinggi minimal 420px).
- Setelah itu: rel Papan Lorong, grid "Baru masuk rak", grid "Kertas per rim & box", lalu satu blok "Datang ke toko" (foto papan lorong, alamat, jam, ulasan, rute, WhatsApp).
- Hindari dinding kartu yang seragam. Foto lorong adalah satu-satunya bidang besar; grid dan blok info tetap tenang.

**Grid barang:** 2 kolom di HP, 3 kolom di ≥640px, 5 kolom di ≥1024px. Kartu berbagi garis 1px (`border-t border-l` pada grid, `border-b border-r` pada kartu), seperti sekat rak.

**Panel:** sidebar 220px yang menempel, dan area kerja fleksibel.

**Di bawah 768px:**
- Kotak cari pindah ke baris kedua header yang menempel. Kotak cari besar di bagian pembuka disembunyikan supaya tidak ada dua kotak cari.
- Foto pembuka tampil di atas dengan rasio 4:3.
- Rel Papan Lorong menjadi satu baris yang bisa digeser (papan selebar 150px).
- Navigasi bawah tetap 56px (Beranda · Kategori · Favorit · Keranjang) dan menghormati `safe-area-inset-bottom`.
- Sidebar panel menjadi tab horizontal yang bisa digeser.

Semua kontrol punya target sentuh minimal 44×44px. Ada dua cara: ukurannya memang 44px (`h-11`), atau kelas `.tap` memperluas area sentuh tanpa mengubah ukuran visualnya. Cara kedua dipakai pada tombol "+" dan favorit di kartu, chip sub-kategori, breadcrumb, tautan "Semua kategori", dan tautan kecil di panel. Nama barang di kartu membentangkan area kliknya ke seluruh kartu. Kotak centang berukuran 20px di dalam label setinggi 44px. Hanya tautan di dalam kalimat yang dikecualikan (WCAG 2.5.8, *inline*).

## Elevasi dan kedalaman

Gunakan perubahan permukaan (`paper` → `surface`) dan garis 1px sebelum bayangan. Kartu, panel, dan blok info **datar**. Hanya daftar saran pencarian dan dialog panel yang memakai bayangan `0 8px 24px -12px rgb(0 0 0 / .25)`. Dialog diberi latar belakang `rgb(15 17 34 / .45)`. Header yang menempel memakai `surface` 95% dengan blur latar. Merah tidak boleh menjadi pendaran, dan tidak ada bayangan berwarna.

## Bentuk

| Radius | Dipakai untuk |
|---|---|
| 2px (`--radius-sign`) + bingkai `ink` 1,5px | Papan lorong dan rel |
| 4px (`--radius-tag`) | Tombol, input, kartu, bingkai foto, nota, dialog, segmen pemilih satuan |
| Pill | Chip sub-kategori, chip status pesanan, badge jumlah keranjang, filter status panel |
| Lingkaran | Titik warna varian (12px di kartu, 32px dalam cincin 44px di detail), tombol favorit |

Tidak ada sudut besar untuk "panggung": toko ini kotak dan rapat.

## Interaksi dan gerak

- **Umpan balik kontrol:** 150ms ease-out pada warna, isi, garis, outline, dan opasitas. Berlaku otomatis untuk semua `a`, `button`, `input`, `select`, dan `textarea`. Tidak ada efek memantul atau membesar.
- **Satu gerak yang khas:** papan lorong berayun `rotate(-1.2deg)` selama 180ms saat disorot, berporos pada tali (`transform-origin: 50% -26px`).
- **Tombol "+":** berubah hijau dengan "✓" selama 1,4 detik setelah barang masuk, dan diumumkan lewat `role="status"`.
- **Cincin fokus:** `:focus-visible` 2px `brand-text` dengan offset 2px. Kotak cari memakai cincin yang sama pada pembungkusnya (`focus-within`), karena inputnya tanpa outline.
- **Tanpa gerak dekoratif:** tidak ada scroll-reveal, parallax, carousel, atau teks yang muncul huruf per huruf.
- **`prefers-reduced-motion`:** semua durasi menjadi 0 dan papan tidak berayun.

Status tetap terbaca tanpa gerak:

| Keadaan | Tampilan |
|---|---|
| Memuat | Blok kosong `aria-busy` |
| Kosong | Kalimat ajakan + tombol |
| Gagal | Penjelasan dan cara memperbaiki |
| Stok habis | Teks + coretan |
| Pesanan ditolak (409) | Barang ditandai merah + "Stok habis"/"Sudah tidak dijual dengan satuan ini" |

Status buka/tutup dihitung di perangkat dalam WITA, supaya tidak basi walau halaman diambil dari cache.

## Inventaris cakupan komponen

**Permukaan utama yang sudah ada:**
- Header yang menempel dengan logo, cari, status buka, favorit, dan keranjang.
- Bagian pembuka dengan foto toko.
- Rel Papan Lorong.
- Grid rak.
- Halaman kategori (sub-kategori, filter merek, urutan, paginasi).
- Halaman merek.
- Hasil cari dan cari kosong (tombol "Tanya stok via WhatsApp").
- Detail barang (foto, varian, satuan, jumlah, catatan harga diperbarui).
- Keranjang + nota + formulir pemesanan + layar sukses dengan kode pesanan.
- Favorit dan riwayat dengan "Pesan lagi".
- Halaman alamat & jam buka dengan peta.
- Footer.
- Navigasi bawah HP.
- Panel: masuk, atur sandi, pesanan masuk, daftar dan form barang, ubah harga (satu-satu & massal), kategori & merek, import/export, info toko, pegawai.
- Dialog panel (konfirmasi & isian) memakai `<dialog>` asli: fokus terkunci dan Esc menutup. Pada aksi hapus atau batal, fokus awal ada di "Batal" dan tombol aksinya merah dengan label yang menyebut aksinya ("Hapus kategori", "Batalkan pesanan"). Pada aksi lain, tombol aksinya `ink`.

**Komponen mikro yang sudah ada:**
- Tombol utama (merah), tombol gelap (`ink`), tombol sekunder (bergaris), tombol WhatsApp (hijau).
- Kotak cari combobox dengan navigasi panah.
- Label harga.
- Titik warna.
- Pemilih varian (lingkaran warna atau tombol teks).
- Pemilih satuan (segmented, dengan harga per pcs bila lebih hemat).
- Stepper jumlah.
- Tombol favorit.
- Chip, badge, breadcrumb, paginasi.
- Pill status buka.
- Pengganti foto (nama merek + jenis barang, bukan ilustrasi).
- Honeypot anti-bot.

**Belum ditetapkan sebagai komponen khas:**
- Toast.
- Skeleton loader.
- Zoom/galeri foto.
- Ilustrasi keadaan kosong.
- Paket daftar sekolah (PRD §5.8).

Bila dibutuhkan, turunkan dari token semantik dan tandai sebagai pelengkap produk atau aksesibilitas.

## Kontrak komponen

Front matter YAML di atas mendefinisikan peran visual. Implementasinya ada di file yang disebut di bagian `components`. Jangan membuat varian komponen baru kecuali diminta secara eksplisit. Setiap permintaan implementasi harus menyebut anatomi, slot, varian, keadaan, interaksi, perilaku responsif, komposisi, dan batas anti-salin.

| Komponen | Slot |
|---|---|
| Papan Lorong | rel, tali (2), nama kategori dengan "&"/"," menjadi "/", jumlah barang, keadaan aktif (`aria-current="page"`: papan terbalik `ink` di atas `surface`) |
| Kartu barang | foto atau pengganti, tombol favorit, titik warna (maks. 5 + "+n"), nama (maks. 2 baris), "mulai" bila harga varian berbeda, label harga, satuan, status stok, aksi (tombol "+" untuk barang satu varian, "Pilih" untuk barang bervarian, tanpa aksi bila habis) |
| Label harga | "Rp", angka, satuan ("/pcs", "/rim") |
| Nota keranjang | baris barang (nama, varian, harga satuan, stepper, hapus, subtotal), perkiraan total, jumlah jenis barang, garis putus-putus, nama, cara terima (ambil/antar), jam ambil atau catatan, galat, tombol WhatsApp, petunjuk "tekan kirim di WhatsApp" |
| Dialog panel | judul (pertanyaan berisi nama objek), pesan akibat, input (khusus isian), "Batal", tombol aksi berlabel kata kerja + objek |
| Kartu pesanan panel | kode (mono), chip status, waktu WITA, nama, cara terima, catatan, daftar barang (jumlah + satuan tebal di depan), total, aksi berikutnya ("Mulai siapkan" → "Tandai siap" → "Tandai selesai"), batalkan |

## Prompt komponen

### Pembuka beranda

"Buat bagian pembuka dengan tesis Archivo sempit yang pendek, teks pendukung yang tenang, pill status buka (WITA), dan satu kotak cari besar. Sandingkan dengan foto lorong toko asli. Tanpa gradien, tanpa overlay teks di atas foto, tanpa bahasa iklan. Di HP, foto di atas dan kotak cari hanya ada di header."

### Papan Lorong

"Buat navigasi kategori berupa papan putih bertali dari rel biru `brand`. Isinya nama kategori kapital (`signage`) dan jumlah barang. Di HP satu rel yang bisa digeser, di layar lebar lima papan per rel. Papan aktif terbalik warnanya. Papan boleh berayun 1,2° saat disorot, kecuali saat reduced motion. Jangan menambah ikon atau warna per kategori."

### Rak dan kartu barang

"Buat grid rapat 2/3/5 kolom dengan garis bersama 1px. Kartu memuat foto 1:1 atau pengganti tipografis, titik warna varian, nama dua baris, label harga besar, satuan, status stok berupa teks, dan satu aksi yang sesuai. Seluruh kartu bisa diklik tanpa menelan tombol favorit atau tombol tambah."

### Nota dan pemesanan WhatsApp

"Buat keranjang sebagai daftar plus nota yang menempel. Harga dihitung ulang di server, barang bermasalah ditandai dengan teks. Setelah tersimpan, buka WhatsApp dengan pesan terisi dan tampilkan kode pesanan mono serta tombol 'Buka WhatsApp lagi'. Hijau hanya untuk aksi WhatsApp."

### Kit kontrol panel

"Buat tombol utama/sekunder, input, select, chip status, stepper, input harga inline yang tersimpan saat Enter atau blur dengan teks 'tersimpan'/'gagal', serta formulir varian dan harga bertingkat. Kepadatan kerja 14–15px, permukaan putih datar di atas `paper`, dan semuanya bisa dipakai satu tangan di HP."

## Komposisi lintas pengguna

- **Orang tua & pelajar (musim sekolah):** masuk dari Papan Lorong atau cari. Keranjang diisi dari daftar sekolah, lalu dipilih "Ambil di toko" dengan jam ambil supaya barang disiapkan sebelum datang. Kelak, paket daftar sekolah memakai kartu barang dan nota yang sama.
- **Pembeli kantor/instansi:** satuan lusin/rim/box ditampilkan dengan harga per pcs bila lebih hemat. Riwayat dan "Pesan lagi" mengisi ulang keranjang dengan harga terbaru dan menyebut barang yang harganya berubah atau habis.
- **Pembeli eceran yang ragu stok:** cari kosong langsung menawarkan "Tanya stok via WhatsApp" dengan kata kunci terisi. Kata kunci itu tercatat di panel sebagai "Dicari pelanggan, tapi belum ada".
- **Pemilik & pegawai:** pesanan masuk berjalan *baru → disiapkan → siap → selesai*. Harga diubah inline atau massal per merek/kategori dengan pembulatan, setiap perubahan tercatat di riwayat harga, dan halaman publik diperbarui otomatis.

## Yang dilakukan dan yang dihindari

* Lakukan: pakai merah hanya untuk satu aksi utama per layar, angka keranjang, dan tombol konfirmasi hapus/batal di dialog. Biru untuk struktur dan fokus.
* Lakukan: tulis status (stok, buka/tutup, pesanan) dengan kata, bukan hanya warna.
* Lakukan: biarkan harga menjadi elemen paling menonjol di kartu dan detail barang.
* Lakukan: pakai foto asli toko atau barang, dan potong wajah pelanggan.
* Lakukan: biarkan Papan Lorong menjadi satu-satunya elemen yang berani. Sisanya tenang.
* Lakukan: cantumkan bahwa harga di website adalah perkiraan yang dikonfirmasi toko, beserta tanggal harga diperbarui.
* Hindari: palet krem, gradien, glassmorphism, ikon 3D, foto stok, carousel banner, dan bahasa iklan.
* Hindari: menampilkan logo merek pihak ketiga sebagai hiasan, atau menyalin/mengarang ulasan.
* Hindari: menampilkan nomor atau layanan Printech.
* Hindari: memakai huruf logo "AGUNG" sebagai font UI, atau hotlink font dari CDN.
* Hindari: bayangan pada kartu, sudut besar, atau gerak sebagai satu-satunya penanda keadaan.
* Hindari: `confirm()`, `prompt()`, atau `alert()` bawaan browser. Pakai `useDialog()`.
* Hindari: kontrol di bawah 44×44px tanpa `.tap`.
* Lakukan: jaga fondasi ini selaras dengan perilaku desktop, HP, mode gelap, aksesibilitas, dan komposisi yang sudah disetujui. Bila token di `globals.css` berubah, perbarui dokumen ini di commit yang sama.
