-- Bucket publik untuk foto barang (hanya dijalankan di Supabase; dilewati di Postgres lokal).
-- Upload hanya lewat Express API dengan service role key, jadi tidak perlu policy tulis.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('products', 'products', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
    on conflict (id) do nothing;
  end if;
end $$;
