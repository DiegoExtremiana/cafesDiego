-- Añade la unidad del límite de cafeína al perfil: 'cafes' (por defecto) o 'mg'.
-- El valor del límite se guarda siempre en mg (max_daily_caffeine); esta columna
-- solo indica en qué modo lo introduce y lo ve el usuario.
-- Ejecutar en el SQL Editor de Supabase.

alter table public.profiles
  add column if not exists caffeine_limit_unit text not null default 'cafes'
    check (caffeine_limit_unit in ('cafes', 'mg'));
