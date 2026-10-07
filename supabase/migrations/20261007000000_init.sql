-- Toko New Agung — skema awal
-- Semua akses data lewat Express API (koneksi Postgres langsung). RLS diaktifkan
-- tanpa policy publik, sehingga anon key Supabase tidak bisa membaca/menulis tabel.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ---------------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------------

create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table brands (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique
);

create table products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references categories(id) on delete set null,
  brand_id     uuid references brands(id) on delete set null,
  name         text not null,
  slug         text not null unique,
  description  text not null default '',
  attributes   jsonb not null default '{}',
  is_active    boolean not null default true,
  -- teks pencarian (nama + merek + kategori + label varian), diisi trigger
  search_text  text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  label         text not null default '',          -- 'Biru', '0.5 mm', '58 lembar'
  color_hex     text,                              -- '#1D4ED8' untuk titik warna
  sku           text,
  stock_status  text not null default 'ada' check (stock_status in ('ada', 'sedikit', 'habis')),
  sort_order    int  not null default 0
);

create table variant_prices (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null references product_variants(id) on delete cascade,
  unit          text not null,                     -- 'pcs' | 'lusin' | 'pak' | 'rim' | 'box' | ...
  qty_per_unit  int  not null default 1 check (qty_per_unit > 0),
  price         int  not null check (price >= 0),  -- rupiah
  unique (variant_id, unit)
);

create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete set null,
  path        text not null,                       -- URL publik atau path storage
  sort_order  int  not null default 0
);

create table search_synonyms (
  term     text not null,
  synonym  text not null,
  primary key (term, synonym)
);

create table search_misses (
  id          bigint generated always as identity primary key,
  query       text not null,
  created_at  timestamptz not null default now()
);

create table price_history (
  id                bigint generated always as identity primary key,
  variant_price_id  uuid references variant_prices(id) on delete set null,
  old_price         int not null,
  new_price         int not null,
  changed_by        uuid,
  changed_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pesanan
-- ---------------------------------------------------------------------------

create table order_counters (
  day  date primary key,
  n    int  not null
);

create table orders (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,            -- NA-261007-014
  customer_name    text not null,
  fulfilment       text not null check (fulfilment in ('ambil', 'antar')),
  pickup_note      text not null default '',
  status           text not null default 'baru'
                   check (status in ('baru', 'disiapkan', 'siap', 'selesai', 'batal')),
  estimated_total  int  not null,
  created_at       timestamptz not null default now()
);

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  variant_id      uuid references product_variants(id) on delete set null,
  name_snapshot   text not null,
  unit_snapshot   text not null,
  price_snapshot  int  not null,
  qty             int  not null check (qty > 0)
);

-- ---------------------------------------------------------------------------
-- Toko & staf
-- ---------------------------------------------------------------------------

create table store_settings (
  id             int primary key default 1 check (id = 1),
  name           text not null,
  address        text not null,
  lat            double precision,
  lng            double precision,
  maps_url       text not null default '',
  phone          text not null default '',
  whatsapp       text not null,                     -- format internasional tanpa '+', mis. 6282348485101
  opening_hours  jsonb not null,                    -- {"mon":{"open":"05:00","close":"22:00"}, ...}
  timezone       text not null default 'Asia/Makassar',
  updated_at     timestamptz not null default now()
);

-- user_id = id pengguna Supabase Auth (auth.users.id)
create table staff (
  user_id     uuid primary key,
  email       text not null,
  role        text not null check (role in ('owner', 'staff')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------

create index products_category_idx      on products (category_id) where is_active;
create index products_brand_idx         on products (brand_id) where is_active;
create index products_search_trgm_idx   on products using gin (search_text gin_trgm_ops);
create index variants_product_idx       on product_variants (product_id);
create index variant_prices_variant_idx on variant_prices (variant_id);
create index images_product_idx         on product_images (product_id);
create index orders_created_idx         on orders (created_at desc);
create index order_items_order_idx      on order_items (order_id);

-- ---------------------------------------------------------------------------
-- Teks pencarian
-- ---------------------------------------------------------------------------

create or replace function normalize_search(t text) returns text
language sql immutable as $$
  select lower(unaccent('unaccent', coalesce(t, '')))
$$;

create or replace function refresh_product_search(pid uuid) returns void
language sql as $$
  update products p set search_text = normalize_search(concat_ws(' ',
      p.name,
      (select b.name from brands b where b.id = p.brand_id),
      (select c.name from categories c where c.id = p.category_id),
      (select string_agg(v.label || ' ' || coalesce(v.sku, ''), ' ')
         from product_variants v where v.product_id = p.id)
    ))
  where p.id = pid
$$;

create or replace function products_search_trigger() returns trigger
language plpgsql as $$
begin
  perform refresh_product_search(new.id);
  return null;
end $$;

create trigger products_search_aiu
  after insert or update of name, brand_id, category_id on products
  for each row execute function products_search_trigger();

create or replace function variants_search_trigger() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform refresh_product_search(old.product_id);
  else
    perform refresh_product_search(new.product_id);
  end if;
  return null;
end $$;

create trigger variants_search_aiud
  after insert or update of label, sku or delete on product_variants
  for each row execute function variants_search_trigger();

-- Ganti nama merek/kategori → perbarui teks pencarian barangnya
create or replace function brands_search_trigger() returns trigger
language plpgsql as $$
begin
  perform refresh_product_search(p.id) from products p where p.brand_id = new.id;
  return null;
end $$;

create trigger brands_search_au
  after update of name on brands
  for each row execute function brands_search_trigger();

create or replace function categories_search_trigger() returns trigger
language plpgsql as $$
begin
  perform refresh_product_search(p.id) from products p where p.category_id = new.id;
  return null;
end $$;

create trigger categories_search_au
  after update of name on categories
  for each row execute function categories_search_trigger();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_touch before update on products
  for each row execute function touch_updated_at();

create trigger store_settings_touch before update on store_settings
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Riwayat harga (changed_by diisi API lewat set_config('app.user_id', ...))
-- ---------------------------------------------------------------------------

create or replace function variant_prices_history_trigger() returns trigger
language plpgsql as $$
begin
  if new.price is distinct from old.price then
    insert into price_history (variant_price_id, old_price, new_price, changed_by)
    values (new.id, old.price, new.price, nullif(current_setting('app.user_id', true), '')::uuid);
    update products p set updated_at = now()
      from product_variants v where v.id = new.variant_id and p.id = v.product_id;
  end if;
  return new;
end $$;

create trigger variant_prices_history_au
  after update of price on variant_prices
  for each row execute function variant_prices_history_trigger();

-- ---------------------------------------------------------------------------
-- Kode pesanan harian: NA-YYMMDD-NNN (tanggal WITA)
-- ---------------------------------------------------------------------------

create or replace function next_order_code(tz text default 'Asia/Makassar') returns text
language plpgsql as $$
declare
  d date := (now() at time zone tz)::date;
  seq int;
begin
  insert into order_counters (day, n) values (d, 1)
  on conflict (day) do update set n = order_counters.n + 1
  returning n into seq;
  return 'NA-' || to_char(d, 'YYMMDD') || '-' || lpad(seq::text, 3, '0');
end $$;

-- ---------------------------------------------------------------------------
-- RLS: kunci semua tabel dari akses langsung anon/authenticated
-- ---------------------------------------------------------------------------

alter table categories        enable row level security;
alter table brands            enable row level security;
alter table products          enable row level security;
alter table product_variants  enable row level security;
alter table variant_prices    enable row level security;
alter table product_images    enable row level security;
alter table search_synonyms   enable row level security;
alter table search_misses     enable row level security;
alter table price_history     enable row level security;
alter table order_counters    enable row level security;
alter table orders            enable row level security;
alter table order_items       enable row level security;
alter table store_settings    enable row level security;
alter table staff             enable row level security;
