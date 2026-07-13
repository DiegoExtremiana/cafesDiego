-- =============================================================
-- Fotos de perfil (avatares).
-- Columna profiles.avatar_url + bucket de Storage 'avatars' + políticas.
-- Estructura de rutas: avatars/{user_id}/{uuid}.webp  (un solo archivo por
-- usuario; el cliente borra los antiguos al subir/eliminar). Bucket público:
-- las URLs se usan directamente en <img> en toda la app.
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================

-- ---------- Columna (idempotente; también se crea en 20260713_grupos_interfaz.sql) ----------
alter table public.profiles add column if not exists avatar_url text;

-- ---------- Bucket ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- ---------- Políticas de storage.objects para el bucket 'avatars' ----------
-- Lectura pública (para mostrar avatares en cualquier parte, incl. perfil público).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuario solo puede escribir/actualizar/borrar dentro de su carpeta {uid}/.
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
