-- Amplía los tipos de consumición permitidos en coffees.type.
-- Con cafeína: energetica, te_negro, te_verde, matcha, cola.
-- Sin cafeína: zumo, leche, infusion, cerveza (todas 0 mg de cafeína).
-- Los mg de cada bebida viven en el frontend (src/types/coffee.ts); la BD solo
-- restringe los valores. Idempotente: se puede reejecutar sin problema.
-- Ejecutar en el SQL Editor de Supabase.

alter table public.coffees drop constraint if exists coffees_type_check;

alter table public.coffees add constraint coffees_type_check
  check (type in (
    'espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro',
    'energetica', 'te_negro', 'te_verde', 'matcha', 'cola',
    'zumo', 'leche', 'infusion', 'cerveza'
  ));
