import type {
  Brand,
  Category,
  Paginated,
  ProductDetail,
  ProductListQuery,
  ProductSummary,
  StockStatus,
  Variant,
} from '@newagung/shared';
import type { Queryable } from '../db';

// ---------------------------------------------------------------------------
// Pencarian
// ---------------------------------------------------------------------------

export function normalizeQuery(q: string): string {
  return q
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

interface SearchPlan {
  /** potongan SQL WHERE yang memakai alias `p` */
  where: string;
  /** ekspresi skor relevansi */
  rank: string;
  params: unknown[];
}

/**
 * Setiap kata di kueri harus cocok (substring atau mirip ejaannya) dengan teks
 * pencarian barang. Kata boleh diganti sinonimnya ("tipex" → "koreksi").
 * Sinonim untuk seluruh frasa ("label harga") juga dicoba sebagai alternatif.
 */
export async function buildSearchPlan(db: Queryable, rawQuery: string, startIndex: number): Promise<SearchPlan | null> {
  const q = normalizeQuery(rawQuery);
  if (!q) return null;
  const words = [...new Set(q.split(' ').filter(Boolean))].slice(0, 6);

  const { rows } = await db.query<{ term: string; synonym: string }>(
    `select normalize_search(term) as term, normalize_search(synonym) as synonym
       from search_synonyms
      where normalize_search(term) = any($1) or normalize_search(synonym) = any($1)`,
    [[...words, q]],
  );
  const alternatives = (w: string) => {
    const set = new Set([w]);
    for (const r of rows) {
      if (r.term === w) set.add(r.synonym);
      if (r.synonym === w) set.add(r.term);
    }
    return [...set];
  };

  const params: unknown[] = [];
  const next = (v: unknown) => {
    params.push(v);
    return `$${startIndex + params.length - 1}`;
  };

  const wordConds = words.map((w) => {
    const likes = next(alternatives(w).map((a) => `%${escapeLike(a)}%`));
    const word = next(w);
    return `(p.search_text like any(${likes}) or ${word} <% p.search_text)`;
  });

  let where = `(${wordConds.join(' and ')})`;
  const phraseAlts = alternatives(q).filter((a) => a !== q);
  if (words.length > 1 && phraseAlts.length) {
    const likes = next(phraseAlts.map((a) => `%${escapeLike(a)}%`));
    where = `(${where} or p.search_text like any(${likes}))`;
  }

  const full = next(q);
  const prefix = next(`${escapeLike(q)}%`);
  const rank = `(word_similarity(${full}, p.search_text) + case when lower(p.name) like ${prefix} then 1 else 0 end)`;

  return { where, rank, params };
}

// ---------------------------------------------------------------------------
// Daftar barang
// ---------------------------------------------------------------------------

interface SummaryRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category_slug: string | null;
  image: string | null;
  price: number | null;
  unit: string | null;
  default_variant_id: string | null;
  default_label: string | null;
  default_stock: StockStatus | null;
  variant_count: number;
  all_out: boolean | null;
  min_price: number | null;
  max_price: number | null;
  colors: { label: string; hex: string }[] | null;
  updated_at: Date;
  total: number;
}

const SUMMARY_SELECT = `
  p.id, p.slug, p.name, b.name as brand, c.slug as category_slug, p.updated_at,
  (select i.path from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image,
  dv.price, dv.unit, dv.variant_id as default_variant_id, dv.label as default_label, dv.stock_status as default_stock,
  va.variant_count, va.all_out, va.min_price, va.max_price, va.colors`;

const SUMMARY_JOINS = `
  left join brands b on b.id = p.brand_id
  left join categories c on c.id = p.category_id
  left join lateral (
    select v.id as variant_id, v.label, v.stock_status, vp.price, vp.unit
      from product_variants v
      join variant_prices vp on vp.variant_id = v.id
     where v.product_id = p.id
     order by (v.stock_status = 'habis'), v.sort_order, vp.qty_per_unit, vp.price
     limit 1
  ) dv on true
  left join lateral (
    select count(*)::int as variant_count,
           bool_and(v.stock_status = 'habis') as all_out,
           min(bp.price) as min_price,
           max(bp.price) as max_price,
           json_agg(json_build_object('label', v.label, 'hex', v.color_hex) order by v.sort_order)
             filter (where v.color_hex is not null) as colors
      from product_variants v
      left join lateral (
        select price from variant_prices where variant_id = v.id order by qty_per_unit, price limit 1
      ) bp on true
     where v.product_id = p.id
  ) va on true`;

function toSummary(r: SummaryRow): ProductSummary {
  const stockStatus: StockStatus = r.all_out ? 'habis' : (r.default_stock ?? 'habis');
  const quickAdd =
    r.variant_count === 1 && r.default_variant_id && r.unit && r.price !== null && stockStatus !== 'habis'
      ? { variantId: r.default_variant_id, unit: r.unit, price: r.price, label: r.default_label ?? '' }
      : null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    categorySlug: r.category_slug,
    image: r.image,
    price: r.price ?? 0,
    unit: r.unit ?? 'pcs',
    priceVaries: r.min_price !== r.max_price,
    stockStatus,
    colors: r.colors ?? [],
    variantCount: r.variant_count,
    quickAdd,
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function listProducts(
  db: Queryable,
  query: ProductListQuery,
): Promise<Paginated<ProductSummary>> {
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const where: string[] = ['p.is_active'];

  if (query.category) {
    const slug = add(query.category);
    where.push(`p.category_id in (
      select id from categories where slug = ${slug}
      union select ch.id from categories ch join categories pa on pa.id = ch.parent_id where pa.slug = ${slug})`);
  }
  if (query.brand) where.push(`b.slug = ${add(query.brand)}`);
  if (query.minPrice !== undefined) where.push(`dv.price >= ${add(query.minPrice)}`);
  if (query.maxPrice !== undefined) where.push(`dv.price <= ${add(query.maxPrice)}`);

  let rank = '0';
  if (query.q) {
    const plan = await buildSearchPlan(db, query.q, params.length + 1);
    if (plan) {
      params.push(...plan.params);
      where.push(plan.where);
      rank = plan.rank;
    }
  }

  const sort = query.sort ?? (query.q ? 'relevan' : 'terbaru');
  const orderBy = {
    relevan: `${rank} desc, p.name`,
    terbaru: 'p.created_at desc, p.name',
    termurah: 'dv.price asc nulls last, p.name',
    termahal: 'dv.price desc nulls last, p.name',
    az: 'p.name',
  }[sort];

  const limit = add(query.pageSize);
  const offset = add((query.page - 1) * query.pageSize);

  const { rows } = await db.query<SummaryRow>(
    `select ${SUMMARY_SELECT}, count(*) over()::int as total
       from products p ${SUMMARY_JOINS}
      where ${where.join(' and ')}
      order by ${orderBy}
      limit ${limit} offset ${offset}`,
    params,
  );

  return {
    items: rows.map(toSummary),
    page: query.page,
    pageSize: query.pageSize,
    total: rows[0]?.total ?? 0,
  };
}

export async function productSummariesByIds(db: Queryable, ids: string[]): Promise<ProductSummary[]> {
  if (!ids.length) return [];
  const { rows } = await db.query<SummaryRow>(
    `select ${SUMMARY_SELECT}, 0 as total from products p ${SUMMARY_JOINS}
      where p.id = any($1) and p.is_active`,
    [ids],
  );
  const byId = new Map(rows.map((r) => [r.id, toSummary(r)]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductSummary => Boolean(p));
}

// ---------------------------------------------------------------------------
// Saran pencarian
// ---------------------------------------------------------------------------

export interface Suggestion {
  type: 'product' | 'category' | 'brand';
  label: string;
  slug: string;
}

export async function suggest(db: Queryable, rawQuery: string): Promise<Suggestion[]> {
  const q = normalizeQuery(rawQuery);
  if (q.length < 2) return [];
  const prefix = `${escapeLike(q)}%`;
  const contains = `%${escapeLike(q)}%`;

  const [cats, brands] = await Promise.all([
    db.query<{ name: string; slug: string }>(
      `select name, slug from categories where normalize_search(name) like $1 order by sort_order limit 2`,
      [contains],
    ),
    db.query<{ name: string; slug: string }>(
      `select name, slug from brands where normalize_search(name) like $1 order by name limit 2`,
      [prefix],
    ),
  ]);

  const plan = await buildSearchPlan(db, q, 1);
  const products = plan
    ? await db.query<{ name: string; slug: string }>(
        `select p.name, p.slug from products p
          where p.is_active and ${plan.where}
          order by ${plan.rank} desc, p.name limit 6`,
        plan.params,
      )
    : { rows: [] };

  const out: Suggestion[] = [
    ...brands.rows.map((r) => ({ type: 'brand' as const, label: r.name, slug: r.slug })),
    ...cats.rows.map((r) => ({ type: 'category' as const, label: r.name, slug: r.slug })),
    ...products.rows.map((r) => ({ type: 'product' as const, label: r.name, slug: r.slug })),
  ];
  return out.slice(0, 6);
}

export async function recordSearchMiss(db: Queryable, q: string): Promise<void> {
  const normalized = normalizeQuery(q).slice(0, 100);
  if (normalized.length >= 2) {
    await db.query('insert into search_misses (query) values ($1)', [normalized]);
  }
}

// ---------------------------------------------------------------------------
// Detail barang
// ---------------------------------------------------------------------------

interface DetailRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  updated_at: Date;
  brand: Brand | null;
  category: ProductDetail['category'];
  images: string[];
  variants: Variant[];
}

export async function getProduct(
  db: Queryable,
  by: { slug: string } | { id: string },
  opts: { includeInactive?: boolean } = {},
): Promise<ProductDetail | null> {
  const [col, value] = 'slug' in by ? ['p.slug', by.slug] : ['p.id', by.id];
  const { rows } = await db.query<DetailRow>(
    `select p.id, p.slug, p.name, p.description, p.is_active, p.updated_at,
       case when b.id is null then null
            else json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) end as brand,
       case when c.id is null then null
            else json_build_object('id', c.id, 'name', c.name, 'slug', c.slug,
                   'parent', case when pc.id is null then null
                                  else json_build_object('name', pc.name, 'slug', pc.slug) end) end as category,
       coalesce((select json_agg(i.path order by i.sort_order) from product_images i where i.product_id = p.id), '[]') as images,
       coalesce((
         select json_agg(json_build_object(
                  'id', v.id, 'label', v.label, 'colorHex', v.color_hex, 'sku', v.sku,
                  'stockStatus', v.stock_status,
                  'prices', coalesce((
                    select json_agg(json_build_object('id', vp.id, 'unit', vp.unit, 'qtyPerUnit', vp.qty_per_unit, 'price', vp.price)
                                    order by vp.qty_per_unit, vp.price)
                      from variant_prices vp where vp.variant_id = v.id), '[]'))
                order by v.sort_order)
           from product_variants v where v.product_id = p.id), '[]') as variants
     from products p
     left join brands b on b.id = p.brand_id
     left join categories c on c.id = p.category_id
     left join categories pc on pc.id = c.parent_id
     where ${col} = $1 ${opts.includeInactive ? '' : 'and p.is_active'}`,
    [value],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    brand: r.brand,
    category: r.category,
    images: r.images,
    variants: r.variants,
    isActive: r.is_active,
    updatedAt: r.updated_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Kategori & merek
// ---------------------------------------------------------------------------

export async function listCategories(db: Queryable): Promise<Category[]> {
  const { rows } = await db.query<{
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    sort_order: number;
    own_count: number;
  }>(
    `select c.id, c.parent_id, c.name, c.slug, c.sort_order,
            (select count(*) from products p where p.category_id = c.id and p.is_active)::int as own_count
       from categories c
      order by c.sort_order, c.name`,
  );
  const nodes = new Map<string, Category>(
    rows.map((r) => [
      r.id,
      { id: r.id, parentId: r.parent_id, name: r.name, slug: r.slug, sortOrder: r.sort_order, productCount: r.own_count, children: [] },
    ]),
  );
  const roots: Category[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children!.push(node);
      parent.productCount += node.productCount;
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function listBrands(db: Queryable): Promise<Brand[]> {
  const { rows } = await db.query<Brand>(
    `select b.id, b.name, b.slug,
            (select count(*) from products p where p.brand_id = b.id and p.is_active)::int as "productCount"
       from brands b order by b.name`,
  );
  return rows;
}
