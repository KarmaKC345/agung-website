export type StockStatus = 'ada' | 'sedikit' | 'habis';
export type Fulfilment = 'ambil' | 'antar';
export type OrderStatus = 'baru' | 'disiapkan' | 'siap' | 'selesai' | 'batal';
export type StaffRole = 'owner' | 'staff';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  /** jumlah barang aktif, termasuk di sub-kategori */
  productCount: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface VariantPrice {
  id: string;
  unit: string;
  qtyPerUnit: number;
  price: number;
  /** harga coret (sebelum diskon), null bila tidak promo */
  originalPrice: number | null;
}

export interface Variant {
  id: string;
  label: string;
  colorHex: string | null;
  sku: string | null;
  stockStatus: StockStatus;
  prices: VariantPrice[];
}

/** Ringkasan barang untuk kartu di daftar/grid */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  categorySlug: string | null;
  image: string | null;
  /** harga satuan terkecil dari varian pertama yang tersedia */
  price: number;
  unit: string;
  /** harga coret bila sedang promo */
  originalPrice: number | null;
  discountPercent: number | null;
  /** jumlah pesanan yang sudah diproses toko (180 hari) */
  sold: number;
  featured: boolean;
  /** true jika varian punya harga berbeda-beda */
  priceVaries: boolean;
  stockStatus: StockStatus;
  colors: { label: string; hex: string }[];
  variantCount: number;
  /** varian default untuk tombol + cepat (null jika perlu pilih varian dulu) */
  quickAdd: { variantId: string; unit: string; price: number; label: string } | null;
  updatedAt: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: Brand | null;
  category: { id: string; name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  images: string[];
  variants: Variant[];
  isActive: boolean;
  isFeatured: boolean;
  sold: number;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OpeningHours {
  open: string; // 'HH:MM'
  close: string; // 'HH:MM'
}

export type WeeklyHours = Partial<Record<DayKey, OpeningHours | null>>;

export interface StoreInfo {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
  phone: string;
  whatsapp: string;
  openingHours: WeeklyHours;
  timezone: string;
}

export interface OrderItemView {
  variantId: string | null;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export interface OrderView {
  id: string;
  code: string;
  customerName: string;
  fulfilment: Fulfilment;
  pickupNote: string;
  status: OrderStatus;
  estimatedTotal: number;
  createdAt: string;
  items: OrderItemView[];
}

export interface CurrentPrice {
  variantId: string;
  unit: string;
  price: number | null; // null jika satuan sudah tidak dijual
  stockStatus: StockStatus | null; // null jika varian sudah dihapus
  name: string | null;
}

export interface StaffMember {
  userId: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  linkUrl: string;
  theme: 'brand' | 'signal' | 'ink';
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}
