-- Kolom pengiriman (kurir, layanan, ongkos kirim, dan alamat pengantaran)
alter table orders
  add column if not exists shipping_courier text,
  add column if not exists shipping_service text,
  add column if not exists shipping_cost int not null default 0,
  add column if not exists delivery_address text,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;
