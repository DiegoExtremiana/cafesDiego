-- =============================================================
-- Contador de cigarros (opcional).
-- Añade a profiles:
--   - cigarettes_enabled: activa el botón y las secciones de cigarros.
--   - max_daily_cigarettes: límite diario recomendado (null = sin límite).
--   - show_cigarettes: si el perfil público muestra los cigarros.
-- Crea la tabla `cigarettes` (misma forma que `coffees`: smoked_at es la
-- única fuente de verdad temporal), su RLS (propios; lectura pública si el
-- perfil del dueño es público) y la añade a la publicación de Realtime.
-- Idempotente. Ejecutar en el SQL Editor de Supabase.
-- =============================================================

-- ---- Columnas de perfil -------------------------------------
alter table public.profiles
  add column if not exists cigarettes_enabled boolean not null default false;

alter table public.profiles
  add column if not exists max_daily_cigarettes smallint
    check (max_daily_cigarettes is null or max_daily_cigarettes > 0);

alter table public.profiles
  add column if not exists show_cigarettes boolean not null default false;

-- ---- Tabla de cigarros --------------------------------------
create table if not exists public.cigarettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  smoked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists cigarettes_user_smoked_idx
  on public.cigarettes (user_id, smoked_at desc);

-- ---- Row Level Security -------------------------------------
alter table public.cigarettes enable row level security;

drop policy if exists "cigarettes_select_own_or_public" on public.cigarettes;
create policy "cigarettes_select_own_or_public"
  on public.cigarettes for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = cigarettes.user_id and p.is_public
    )
  );

drop policy if exists "cigarettes_insert_own" on public.cigarettes;
create policy "cigarettes_insert_own"
  on public.cigarettes for insert
  with check (auth.uid() = user_id);

drop policy if exists "cigarettes_update_own" on public.cigarettes;
create policy "cigarettes_update_own"
  on public.cigarettes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cigarettes_delete_own" on public.cigarettes;
create policy "cigarettes_delete_own"
  on public.cigarettes for delete
  using (auth.uid() = user_id);

-- ---- Tiempo real --------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cigarettes'
  ) then
    alter publication supabase_realtime add table public.cigarettes;
  end if;
end $$;
