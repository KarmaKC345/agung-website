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
Skrip `docker/db/init.sh` hanya berjalan saat volume database masih kosong. Migrasi baru
di `supabase/migrations/` nanti dijalankan manual:
`docker compose exec -T db psql -U newagung -d newagung < supabase/migrations/NAMA_FILE.sql`.

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
   Kolom: `kategori, merek, nama, varian, warna, sku, satuan, isi, harga, stok, deskripsi`.
   Satu baris = satu harga. Barang dengan nama sama digabung jadi satu.

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

Setelah harga atau barang diubah di panel, API memanggil `POST /api/revalidate` di website
sehingga halaman terkait langsung diperbarui.

## Catatan desain

Fondasi desain lengkap (token, tipografi, kontras terukur, kontrak komponen) ada di
[`DESIGN.md`](DESIGN.md). Ringkasnya:

- Warna dari logo: biru `#282C83`, merah `#D11D20`. Latar abu dingin seperti lantai keramik
  dan latar logo, bukan krem.
- Ciri khas: **papan lorong gantung**. Kategori ditampilkan seperti papan putih bertali di
  lorong toko (`.aisle-sign` di `apps/web/app/globals.css`).
- Harga seperti label rak: Archivo sempit tebal dengan angka tabular.
- Logo di `apps/web/components/Logo.tsx` digambar ulang dari foto logo. Ganti dengan file
  vektor asli bila ada.
- Foto toko di `apps/web/public/foto/` dipakai dengan izin pemilik, dan dipotong supaya
  wajah pelanggan tidak terlihat jelas.
