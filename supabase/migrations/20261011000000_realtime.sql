-- Aktifkan Supabase Realtime untuk katalog publik
-- ---------------------------------------------------------------------------

-- 1. Policy SELECT untuk anon agar Supabase Realtime mengizinkan broadcast perubahan
create policy "Public read categories" on categories for select to anon using (true);
create policy "Public read brands" on brands for select to anon using (true);
create policy "Public read products" on products for select to anon using (true);
create policy "Public read product_variants" on product_variants for select to anon using (true);
create policy "Public read variant_prices" on variant_prices for select to anon using (true);
create policy "Public read product_images" on product_images for select to anon using (true);
create policy "Public read store_settings" on store_settings for select to anon using (true);
create policy "Public read promo_banners" on promo_banners for select to anon using (true);

-- 2. Daftarkan tabel ke publikasi supabase_realtime
alter publication supabase_realtime add table 
  categories,
  brands,
  products,
  product_variants,
  variant_prices,
  product_images,
  store_settings,
  promo_banners;
