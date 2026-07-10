-- Amplía los tipos de consumición permitidos en coffees.type.
-- Con cafeína: energetica (1,5 cafés), te_negro (0,5), te_verde (0,3), matcha (0,8), cola (0,3).
-- Sin cafeína: zumo, leche, infusion (todas valen 0 cafés).
-- Los pesos viven en el frontend (src/types/coffee.ts); la BD solo restringe los valores.
-- Ejecutar en el SQL Editor de Supabase.

alter table public.coffees drop constraint if exists coffees_type_check;

alter table public.coffees add constraint coffees_type_check
  check (type in (
    'espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro',
    'energetica', 'te_negro', 'te_verde', 'matcha', 'cola',
    'zumo', 'leche', 'infusion'
  ));
