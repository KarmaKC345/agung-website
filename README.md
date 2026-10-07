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

## Menjalankan di komputer sendiri

Butuh Node 22, pnpm 10, dan PostgreSQL (lokal atau Docker). Supabase **tidak** wajib untuk
pengembangan.

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

## Data barang

`supabase/seed.sql` berisi info toko asli, kategori sesuai papan lorong, merek, dan sinonim
pencarian. **Barang dan harga di dalamnya hanya contoh.** Sebelum website dibuka untuk umum:

1. Hapus barang contoh: `delete from products;` (di SQL editor Supabase).
2. Panel → **Import / export** → unduh template, isi dari ekspor program kasir, lalu import.
   Kolom: `kategori, merek, nama, varian, warna, sku, satuan, isi, harga, stok, deskripsi`.
   Satu baris = satu harga. Barang dengan nama sama digabung jadi satu.

## Deploy

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
  `CORS_ORIGINS=https://newagung.com`, `WEB_URL=https://newagung.com`, `REVALIDATE_SECRET`.
  **Jangan isi `DEV_AUTH_TOKEN`.** Token ini juga otomatis diabaikan bila `SUPABASE_URL` terisi.

### 3. Website (Vercel)

- Root directory: `apps/web` (Vercel mendeteksi pnpm workspace).
- Environment: `NEXT_PUBLIC_API_URL` (URL API), `NEXT_PUBLIC_SITE_URL=https://newagung.com`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`.
- API harus sudah jalan saat build, karena beranda dan halaman kategori dibuat saat build.
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
