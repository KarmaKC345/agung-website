# Website Toko New Agung

Katalog online Toko New Agung Alat Tulis & Kantor (Jl. DR. Ratulangi No.52, Makassar).
Pelanggan bisa melihat barang dan harga, lalu memesan lewat WhatsApp. Pemilik dan pegawai
mengelola barang, harga, dan pesanan lewat panel. Rencana lengkap ada di [`docs/PRD.md`](docs/PRD.md).

```
apps/web        Next.js 16 (App Router, Tailwind v4) — website + panel /panel
apps/api        Express 5 — REST API, login Supabase, upload foto, import/export
packages/shared Tipe, validasi zod, format rupiah, jam buka WITA, pesan WhatsApp
supabase/       Migrasi SQL + data awal (seed.sql)
```

## Pengembangan (tanpa Docker)

Butuh Node 22, pnpm 10, dan PostgreSQL. Supabase **tidak** wajib untuk pengembangan.

```bash
pnpm install

# database lokal (skema + data awal)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/newagung pnpm db:local

cp apps/api/.env.example apps/api/.env          # sesuaikan DATABASE_URL bila perlu
cp apps/web/.env.example apps/web/.env.local
# samakan REVALIDATE_SECRET di kedua file

pnpm dev        # API di :4000, website di :3000
```

- Website: http://localhost:3000
- Panel: http://localhost:3000/panel. Tanpa Supabase, kata sandinya adalah nilai
  `DEV_AUTH_TOKEN` di `apps/api/.env` (bawaan `dev-owner`).

Tes:

```bash
pnpm test        # tes shared + tes API terhadap Postgres (database newagung_test dibuat otomatis)
pnpm typecheck
```

## Menjalankan dengan Docker (komputer sendiri)

Cara termudah untuk mencoba semuanya sekaligus: database PostgreSQL, API, dan website
berjalan di Docker, sedangkan login panel memakai Supabase Auth (gratis).

### Yang dibutuhkan

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) atau Docker Engine (Linux).
- Akun [Supabase](https://supabase.com), khusus untuk login panel.

### 1. Siapkan Supabase (sekali saja, ±5 menit)

1. Buat project baru di Supabase (region **Singapore**).
2. **Authentication → Sign In / Providers → Email**: pastikan aktif. Untuk percobaan,
   matikan "Confirm email" supaya tidak perlu verifikasi.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: tambahkan `http://localhost:3000/panel/atur-sandi`
4. **Authentication → Users → Add user → Create new user**: isi email **dan kata sandi**
   pemilik, lalu centang *Auto Confirm User*. Kata sandi ini yang dipakai masuk ke `/panel`.
   (Kalau akun sudah dibuat tanpa kata sandi, tekan "Kirim link buat kata sandi ke email"
   di halaman login panel.)
5. **Project Settings → API**: salin *Project URL*, *anon public key*, dan bila ingin memakai
   fitur "Undang pegawai", *service_role key*.

Database Supabase **tidak** dipakai. Data barang, pesanan, dan foto tersimpan di Docker.

### 2. Isi `.env`

```bash
git clone https://github.com/KarmaKC345/agung-website.git
cd agung-website
cp .env.docker.example .env
```

Buka `.env` lalu isi:

- `POSTGRES_PASSWORD` dan `REVALIDATE_SECRET`: string acak.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: hasil langkah 1.
- `OWNER_EMAIL`: email akun pemilik dari langkah 1.4.

### 3. Jalankan

```bash
docker compose up -d --build
```

Build pertama memakan beberapa menit. Setelah selesai:

- Website: http://localhost:3000
- Panel: http://localhost:3000/panel. Masuk dengan email & kata sandi dari langkah 1.4.
  Akun itu otomatis menjadi **pemilik** saat pertama masuk.

Saat pertama dijalankan, database otomatis terisi skema + data awal (`supabase/seed.sql`).

**Migrasi otomatis.** Setiap kali API menyala, migrasi di `supabase/migrations/` yang belum
pernah dijalankan langsung dijalankan dan dicatat di tabel `schema_migrations`. Jadi setelah
`git pull`, cukup `docker compose up -d --build`; tidak perlu menjalankan SQL manual. Data
awal (`seed.sql`) hanya dimasukkan bila database masih kosong. Matikan dengan
`AUTO_MIGRATE=false` / `AUTO_SEED=false` bila perlu.

### Perintah sehari-hari

| Perlu | Perintah |
|---|---|
| Lihat status | `docker compose ps` |
| Lihat log | `docker compose logs -f api web` |
| Hentikan | `docker compose down` (data & foto tetap aman) |
| Perbarui setelah `git pull` | `docker compose up -d --build` |
| Cadangkan database | `docker compose exec db pg_dump -U newagung newagung > cadangan.sql` |
| Hapus barang contoh | `docker compose exec db psql -U newagung -c "delete from products;"` |
| Ulang dari nol (**menghapus semua data & foto**) | `docker compose down -v` |

Data tersimpan di volume Docker `newagung_db-data` (database) dan `newagung_uploads` (foto).
Skrip lama `docker/db/init.sh` sudah dihapus; database yang dibuat skrip itu dikenali otomatis
dan hanya migrasi barunya yang dijalankan. Contoh promo dan "Pilihan toko" di `seed.sql` hanya
masuk ke database baru. Untuk melihatnya di database lama, isi sendiri lewat panel, atau ulang
dari nol dengan `docker compose down -v` (**menghapus semua data & foto**).

### Tunjukkan ke client (staging)

Untuk meminta masukan client sebelum website online, buka website di komputer ini lewat
link sementara Cloudflare. Gratis, tanpa akun, tanpa domain, dan tanpa membuka port router.

```bash
git pull
docker compose --profile staging up -d --build
docker compose --profile staging logs tunnel
```

Cari baris berisi `https://....trycloudflare.com`, lalu kirim link itu ke client. Di Windows
(PowerShell/CMD) bisa langsung disaring:

```bash
docker compose --profile staging logs tunnel | findstr trycloudflare
```

- Link hanya aktif selama komputer ini menyala dan Docker berjalan.
- Link **berganti** setiap kali tunnel dijalankan ulang (mis. setelah komputer restart).
  Jalankan `docker compose --profile staging logs tunnel` lagi untuk melihat link yang baru.
- Menghentikan link saja (website lokal tetap jalan): `docker compose --profile staging stop tunnel`.
- Pesanan percobaan dari client masuk ke WhatsApp toko dan ke panel seperti pesanan biasa.
  Batalkan dari panel setelah dicoba.
- Panel tetap bisa dibuka client di `<link>/panel` bila Anda memberinya akun.

### Cara kerjanya

```
browser ──▶ web :3000 (Next.js)
              ├─ /api/*, /uploads/*  ──▶ api :4000 (Express, hanya di jaringan Docker)
              │                            ├─▶ db :5432 (PostgreSQL)
              │                            └─▶ volume uploads (foto)
              └─ login panel ──▶ Supabase Auth (internet)
```

Hanya port 3000 yang dibuka ke luar. Ganti dengan `WEB_PORT` di `.env` bila 3000 sudah dipakai.
Nilai `SITE_URL`, `SUPABASE_URL`, dan `SUPABASE_ANON_KEY` ditanam ke website saat build, jadi
setelah mengubahnya jalankan lagi `docker compose up -d --build`.

## Data barang

`supabase/seed.sql` berisi info toko asli, kategori sesuai papan lorong, merek, dan sinonim
pencarian. **Barang dan harga di dalamnya hanya contoh.** Sebelum website dibuka untuk umum:

1. Hapus barang contoh: `delete from products;` (di SQL editor Supabase).
2. Panel → **Import / export** → unduh template, isi dari ekspor program kasir, lalu import.
   Kolom: `kategori, merek, nama, varian, warna, sku, satuan, isi, harga, harga_coret, stok, deskripsi`.
   Satu baris = satu harga. Barang dengan nama sama digabung jadi satu. `harga_coret` (harga
   normal sebelum promo) boleh kosong; bila diisi harus lebih besar dari `harga`.

### Promo, terlaris, pilihan toko, dan banner

Beranda bergaya marketplace dan semua isinya diatur dari panel:

- **Promo spesial:** isi **Harga coret** pada satuan yang sedang diskon (Panel → Barang). Kartu
  menampilkan harga dicoret dan persen diskonnya. Harga coret otomatis dilepas bila harga jual
  dinaikkan melewatinya.
- **Produk terlaris:** dihitung dari pesanan 180 hari terakhir yang sudah diproses toko
  (disiapkan/siap/selesai). Pesanan yang tidak ditindaklanjuti tidak dihitung. Bagian ini baru
  muncul setelah ada pesanan yang diproses.
- **Pilihan toko:** centang "Pilihan toko" di form barang.
- **Banner:** Panel → **Banner beranda**. Unggah foto, tulis judul, pilih halaman tujuan
  (mis. `/barang?promo=1`), dan atur jadwal mulai/selesai bila perlu.

## Deploy ke cloud (nanti)

### 1. Supabase

1. Buat project (region **Singapore**).
2. Jalankan isi `supabase/migrations/*.sql` lalu `supabase/seed.sql` di SQL editor, atau
   dengan Supabase CLI: `supabase db push`. Migrasi storage membuat bucket publik `products`.
3. Authentication → URL Configuration: isi Site URL `https://newagung.com` dan tambahkan
   `https://newagung.com/panel/atur-sandi` ke Redirect URLs.
4. Authentication → Users → **Add user** untuk email pemilik. Isi email yang sama di
   `OWNER_EMAIL` API: saat pertama masuk, akun itu otomatis menjadi pemilik.

### 2. API (Railway / Render / Fly)

- Build: `pnpm install --frozen-lockfile && pnpm --filter @newagung/api build`
- Start: `pnpm --filter @newagung/api start`
- Environment (lihat `apps/api/.env.example`):
  `NODE_ENV=production`, `DATABASE_URL` (Supabase → Connect → Session pooler),
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL`,
  `CORS_ORIGINS=https://newagung.com`, `WEB_URL=https://newagung.com`, `REVALIDATE_SECRET`,
  `IMAGE_STORAGE=supabase` (foto di Supabase Storage, karena disk server cloud biasanya tidak permanen).
  **Jangan isi `DEV_AUTH_TOKEN`.** Token ini juga otomatis diabaikan bila `SUPABASE_URL` terisi.

### 3. Website (Vercel)

- Root directory: `apps/web` (Vercel mendeteksi pnpm workspace).
- Environment: `NEXT_PUBLIC_API_URL` (URL API), `NEXT_PUBLIC_SITE_URL=https://newagung.com`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`.
- Domain: hubungkan `newagung.com`.

**Foto contoh.** 30 dari 32 produk contoh memakai foto contoh dari Wikimedia Commons (lisensi
bebas) di `apps/web/public/produk/`, dengan kredit di halaman `/kredit-foto` (tautan "Kredit foto"
di footer). Untuk menggantinya: Panel → Barang → buka produk, hapus foto contoh (tombol ×),
lalu unggah foto asli.
Setelah semua produk contoh dihapus dan diganti data asli, hapus juga folder `apps/web/public/produk/`
dan isi `apps/web/lib/kredit-foto.json` dengan `[]` agar tautan "Kredit foto" hilang.
Skrip pembuatnya: `python3 scripts/demo-foto.py`.

Setelah harga atau barang diubah di panel, API memanggil `POST /api/revalidate` di website
sehingga halaman terkait langsung diperbarui.

## Catatan desain

Fondasi desain lengkap (token, tipografi, kontras terukur, tata letak, kontrak komponen) ada di
[`DESIGN.md`](DESIGN.md) v3 "Etalase". Ringkasnya:

- Tampilan etalase gaya marketplace (Tokopedia, Shopee, Lazada): banner, ikon kategori, rak
  promo/terlaris/baru, kartu barang dengan badge diskon dan "Dipesan N kali", katalog dengan kolom
  filter, dan halaman barang dengan kotak "Atur jumlah".
- Biru logo `#282C83` untuk semua aksi. Merah logo berarti promo/diskon (tidak pernah untuk
  tombol). Hijau hanya untuk WhatsApp. Latar abu dingin, mode gelap otomatis.
- Font Plus Jakarta Sans (Tokotype, Indonesia, OFL) dan ikon Phosphor.
- Logo di `apps/web/components/Logo.tsx` digambar ulang dari foto logo. Ganti dengan file vektor asli bila ada.
- Foto toko di `apps/web/public/foto/` dipakai dengan izin pemilik, dipotong tanpa wajah pelanggan yang jelas.
