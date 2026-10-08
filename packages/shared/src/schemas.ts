import { z } from 'zod';

const uuid = z.uuid();
const name = z.string().trim().min(1).max(160);
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung')
  .max(80);
const rupiah = z.number().int().min(0).max(1_000_000_000);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam HH:MM');

export const stockStatusSchema = z.enum(['ada', 'sedikit', 'habis']);
export const fulfilmentSchema = z.enum(['ambil', 'antar']);
export const orderStatusSchema = z.enum(['baru', 'disiapkan', 'siap', 'selesai', 'batal']);
export const staffRoleSchema = z.enum(['owner', 'staff']);

// ----------------------------------------------------------------------------
// Publik
// ----------------------------------------------------------------------------

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(1, 'Nama wajib diisi').max(80),
  fulfilment: fulfilmentSchema,
  pickupNote: z.string().trim().max(200).default(''),
  items: z
    .array(
      z.object({
        variantId: uuid,
        unit: z.string().trim().min(1).max(20),
        qty: z.number().int().min(1).max(10_000),
      }),
    )
    .min(1, 'Daftar pesanan kosong')
    .max(100),
  /** honeypot: harus kosong */
  website: z.string().max(0).optional(),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const currentPricesInputSchema = z.object({
  items: z.array(z.object({ variantId: uuid, unit: z.string().min(1).max(20) })).min(1).max(200),
});
export type CurrentPricesInput = z.infer<typeof currentPricesInputSchema>;

export const productListQuerySchema = z.object({
  category: slug.optional(),
  brand: slug.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['relevan', 'terbaru', 'terlaris', 'diskon', 'termurah', 'termahal', 'az']).optional(),
  promo: z.enum(['1', 'true']).transform(() => true).optional(),
  featured: z.enum(['1', 'true']).transform(() => true).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// ----------------------------------------------------------------------------
// Panel
// ----------------------------------------------------------------------------

export const variantPriceInputSchema = z
  .object({
    unit: z.string().trim().min(1).max(20),
    qtyPerUnit: z.number().int().min(1).max(100_000),
    price: rupiah,
    /** harga coret: harus lebih besar dari harga; kosong = tidak promo */
    originalPrice: rupiah.nullable().default(null),
  })
  .refine((p) => p.originalPrice === null || p.originalPrice > p.price, {
    message: 'Harga coret harus lebih besar dari harga jual',
    path: ['originalPrice'],
  });

export const variantInputSchema = z.object({
  id: uuid.optional(),
  label: z.string().trim().max(60).default(''),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .default(null),
  sku: z.string().trim().max(60).nullable().default(null),
  stockStatus: stockStatusSchema.default('ada'),
  prices: z.array(variantPriceInputSchema).min(1, 'Minimal satu harga').max(6),
});

export const productInputSchema = z.object({
  name,
  slug: slug.optional(),
  description: z.string().trim().max(2000).default(''),
  categoryId: uuid.nullable(),
  brandId: uuid.nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(z.string().url().or(z.string().startsWith('/'))).max(5).default([]),
  variants: z.array(variantInputSchema).min(1, 'Minimal satu varian').max(40),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const priceUpdateSchema = z.object({ price: rupiah });

export const bulkPriceSchema = z.object({
  brandId: uuid.optional(),
  categoryId: uuid.optional(),
  percent: z.number().min(-50).max(100),
  /** dibulatkan ke kelipatan ini (rupiah) */
  roundTo: z.union([z.literal(1), z.literal(100), z.literal(500), z.literal(1000)]).default(100),
});
export type BulkPriceInput = z.infer<typeof bulkPriceSchema>;

export const categoryInputSchema = z.object({
  name,
  slug: slug.optional(),
  parentId: uuid.nullable().default(null),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const brandInputSchema = z.object({ name, slug: slug.optional() });

export const orderStatusInputSchema = z.object({ status: orderStatusSchema });

const dayHours = z.object({ open: time, close: time }).nullable();
export const storeInputSchema = z.object({
  name,
  address: z.string().trim().min(1).max(300),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  mapsUrl: z.string().url().or(z.literal('')),
  phone: z.string().trim().max(30),
  whatsapp: z.string().regex(/^62\d{8,13}$/, 'Format 62xxxxxxxxxx'),
  openingHours: z.object({
    mon: dayHours,
    tue: dayHours,
    wed: dayHours,
    thu: dayHours,
    fri: dayHours,
    sat: dayHours,
    sun: dayHours,
  }),
});
export type StoreInput = z.infer<typeof storeInputSchema>;

export const staffInviteSchema = z.object({
  email: z.email(),
  role: staffRoleSchema.default('staff'),
});

export const staffUpdateSchema = z.object({
  role: staffRoleSchema.optional(),
  active: z.boolean().optional(),
});

export const bannerInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().trim().max(140).default(''),
  imageUrl: z.string().url().or(z.string().startsWith('/')).nullable().default(null),
  linkUrl: z.string().trim().startsWith('/', 'Tautan harus halaman di website ini, mis. /barang?promo=1').max(200),
  theme: z.enum(['brand', 'signal', 'ink']).default('brand'),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.iso.datetime({ offset: true }).nullable().default(null),
  endsAt: z.iso.datetime({ offset: true }).nullable().default(null),
});
export type BannerInput = z.infer<typeof bannerInputSchema>;
