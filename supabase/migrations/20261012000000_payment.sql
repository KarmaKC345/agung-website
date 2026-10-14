-- Pembayaran langsung (DANA Payment Gateway). Pesanan lama/WA tetap 'wa' + 'none'.
alter table orders
  add column if not exists payment_method text not null default 'wa' check (payment_method in ('wa', 'dana')),
  add column if not exists payment_status text not null default 'none'
    check (payment_status in ('none', 'pending', 'paid', 'failed', 'expired')),
  add column if not exists payment_ref text,
  add column if not exists paid_at timestamptz;
