-- =============================================================
-- Horario laboral aplicado a los límites diarios.
-- Añade profiles.work_schedule_enabled: cuando está activo, los límites
-- de cafeína y de bebidas solo cuentan los cafés registrados dentro del
-- horario laboral (día laborable + entre work_start y work_end). Los cafés
-- fuera de horario siguen en el histórico, gráficos y grupos, pero no
-- cuentan para el límite personal. El cálculo del límite es de cliente
-- (DashboardPage), así que aquí solo se añade la columna.
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================

alter table public.profiles
  add column if not exists work_schedule_enabled boolean not null default false;
