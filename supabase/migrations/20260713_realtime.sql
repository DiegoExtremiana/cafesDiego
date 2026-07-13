-- =============================================================
-- Tiempo real para los cafés del usuario.
-- Añade la tabla `coffees` a la publicación de Supabase Realtime para que los
-- gráficos y estadísticas se actualicen en vivo entre dispositivos/pestañas.
-- La RLS de `coffees` (propios o públicos) sigue filtrando qué recibe cada
-- suscriptor. Idempotente. Ejecutar en el SQL Editor de Supabase.
-- =============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'coffees'
  ) then
    alter publication supabase_realtime add table public.coffees;
  end if;
end $$;
