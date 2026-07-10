-- =============================================================
-- Contador de cafés — Esquema de base de datos para Supabase
-- Ejecutar en: Dashboard de Supabase -> SQL Editor -> New query
-- =============================================================

-- -------------------------------------------------------------
-- Tabla de perfiles (extiende auth.users)
-- -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text not null default '',
  work_start time not null default '07:00',
  work_end time not null default '14:00',
  -- Días laborables en formato ISO: 1 = lunes ... 7 = domingo
  work_days smallint[] not null default '{1,2,3,4,5}',
  -- Máximo recomendado de cafés al día (null = sin límite configurado)
  max_daily_coffees smallint check (max_daily_coffees is null or max_daily_coffees > 0),
  -- Máximo recomendado de cafeína al día en mg (null = sin límite configurado)
  max_daily_caffeine smallint check (max_daily_caffeine is null or max_daily_caffeine > 0),
  -- Unidad en la que el usuario expresa el límite de cafeína: 'cafes' o 'mg'
  caffeine_limit_unit text not null default 'cafes'
    check (caffeine_limit_unit in ('cafes', 'mg')),
  -- Perfil público y flags de privacidad
  is_public boolean not null default false,
  show_history boolean not null default true,
  show_charts boolean not null default true,
  show_achievements boolean not null default true,
  show_advanced_stats boolean not null default true,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Tabla de cafés
-- taken_at es la única fuente de verdad; fecha y hora se derivan
-- en el cliente respetando la zona horaria del usuario.
-- -------------------------------------------------------------
create table public.coffees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_at timestamptz not null default now(),
  -- Tipo de café elegido al mantener pulsado el botón de registro.
  type text not null default 'espresso'
    check (type in (
      'espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro',
      'energetica', 'te_negro', 'te_verde', 'matcha', 'cola',
      'zumo', 'leche', 'infusion', 'cerveza'
    )),
  has_caffeine boolean not null default true,
  created_at timestamptz not null default now()
);

create index coffees_user_taken_idx on public.coffees (user_id, taken_at desc);

-- -------------------------------------------------------------
-- Trigger: crear perfil automáticamente al registrarse
-- El username llega en los metadatos del registro; si colisiona
-- se añade un sufijo aleatorio.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9_-]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'user' || replace(substr(new.id::text, 1, 8), '-', '');
  end if;
  base_username := substr(base_username, 1, 26);

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.coffees enable row level security;

-- Perfiles: el dueño ve y edita el suyo; los públicos los ve cualquiera
create policy "profiles_select_own_or_public"
  on public.profiles for select
  using (auth.uid() = id or is_public);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cafés: CRUD completo para el dueño; lectura anónima solo si el
-- perfil del dueño es público (necesario para el perfil compartible)
create policy "coffees_select_own_or_public"
  on public.coffees for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = coffees.user_id and p.is_public
    )
  );

create policy "coffees_insert_own"
  on public.coffees for insert
  with check (auth.uid() = user_id);

create policy "coffees_update_own"
  on public.coffees for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "coffees_delete_own"
  on public.coffees for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Migración: límite diario de cafés con cafeína (proyecto ya creado)
-- -------------------------------------------------------------
alter table public.profiles
  add column max_daily_caffeine smallint
    check (max_daily_caffeine is null or max_daily_caffeine > 0);

-- -------------------------------------------------------------
-- RPC: eliminar la cuenta del usuario autenticado
-- Borra auth.users; profiles y coffees caen en cascada por FK.
-- -------------------------------------------------------------
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_user_account() to authenticated;

-- -------------------------------------------------------------
-- RPC: comprobar disponibilidad de usuario/correo antes de registrarse
-- security definer: sortea la RLS de profiles (perfiles privados) y
-- permite leer auth.users, que no es accesible desde el cliente.
-- -------------------------------------------------------------
create or replace function public.username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where username = lower(check_username)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

create or replace function public.email_registered(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.email_registered(text) to anon, authenticated;
