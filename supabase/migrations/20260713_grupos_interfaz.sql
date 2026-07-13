-- =============================================================
-- Rediseño de la interfaz de grupos.
-- Añade: rol 'coadmin', mensajes de grupo, búsqueda de usuarios,
-- serie diaria comparativa, gestión de roles y expulsiones, y
-- extiende my_groups (rol + puesto en el ranking) y group_ranking (rol).
-- Todo el acceso entre usuarios sigue pasando por RPCs SECURITY DEFINER.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 20260711_grupos_amigos.sql.
-- =============================================================

-- ---------- Rol de co-administrador ----------
alter table public.group_members drop constraint if exists group_members_role_check;
alter table public.group_members
  add constraint group_members_role_check check (role in ('owner', 'coadmin', 'member'));

-- ---------- Foto de perfil ----------
-- Columna usada por los RPCs de abajo. La gestión del bucket/almacenamiento
-- está en 20260713_fotos_perfil.sql; aquí solo se garantiza la columna
-- (idempotente) para que estas funciones puedan devolver avatar_url en
-- cualquier orden de ejecución de las migraciones.
alter table public.profiles add column if not exists avatar_url text;

-- ---------- Mensajes de grupo ----------
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_idx
  on public.group_messages (group_id, created_at);
alter table public.group_messages enable row level security;
-- Sin políticas a propósito: acceso solo por las funciones de abajo.

-- ---------- Buscar usuarios (sugerencias del buscador) ----------
drop function if exists public.search_users(text);
create or replace function public.search_users(q text)
returns table (id uuid, username text, display_name text, avatar_url text, is_public boolean)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.is_public
  from public.profiles p
  where p.id <> auth.uid()
    and length(btrim(q)) >= 1
    and (
      p.username ilike '%' || btrim(lower(q)) || '%'
      or p.display_name ilike '%' || btrim(q) || '%'
    )
  order by (p.username ilike btrim(lower(q)) || '%') desc, p.username
  limit 8;
$$;

-- ---------- Mis grupos (con rol y puesto en el ranking) ----------
-- El puesto se ordena de MENOS a MÁS cafeína: quien menos bebe es el nº 1.
-- Cada miembro cuenta desde su joined_at (el momento en que entró al grupo);
-- su historial anterior no se tiene en cuenta.
drop function if exists public.my_groups();
create or replace function public.my_groups(tz text)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  member_count int,
  my_role text,
  my_rank int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select g.id, g.name, g.owner_id, g.created_at, gm.role as my_role
    from public.groups g
    join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
  ),
  totals as (
    select m.id as group_id, mem.user_id,
      coalesce(sum(public.coffee_caffeine_mg(c.type, c.has_caffeine)), 0) as total_mg
    from mine m
    join public.group_members mem on mem.group_id = m.id
    left join public.coffees c on c.user_id = mem.user_id
      and c.taken_at >= mem.joined_at
    group by m.id, mem.user_id
  ),
  ranked as (
    select group_id, user_id,
      rank() over (partition by group_id order by total_mg asc) as rnk
    from totals
  )
  select
    m.id,
    m.name,
    m.owner_id,
    (select count(*)::int from public.group_members gm2 where gm2.group_id = m.id) as member_count,
    m.my_role,
    (select r.rnk::int from ranked r where r.group_id = m.id and r.user_id = auth.uid()) as my_rank,
    m.created_at
  from mine m
  order by m.created_at desc;
$$;

-- ---------- Ranking del grupo (ahora incluye el rol) ----------
drop function if exists public.group_ranking(uuid, text);
create or replace function public.group_ranking(gid uuid, tz text)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  role text,
  today_mg bigint,
  week_mg bigint,
  total_mg bigint,
  today_drinks int,
  week_drinks int,
  total_drinks int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    gm.role,
    coalesce(sum(m.mg) filter (where m.is_today), 0) as today_mg,
    coalesce(sum(m.mg) filter (where m.is_week), 0) as week_mg,
    coalesce(sum(m.mg), 0) as total_mg,
    count(m.id) filter (where m.is_today)::int as today_drinks,
    count(m.id) filter (where m.is_week)::int as week_drinks,
    count(m.id)::int as total_drinks
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join lateral (
    select
      c.id,
      public.coffee_caffeine_mg(c.type, c.has_caffeine) as mg,
      (c.taken_at at time zone tz)::date = (now() at time zone tz)::date as is_today,
      date_trunc('week', c.taken_at at time zone tz)
        = date_trunc('week', now() at time zone tz) as is_week
    from public.coffees c
    where c.user_id = gm.user_id
      -- Cada miembro cuenta desde que entró al grupo, no su historial previo.
      and c.taken_at >= gm.joined_at
  ) m on true
  where gm.group_id = gid
    and public.is_group_member(gid, auth.uid())
  group by p.id, p.username, p.display_name, p.avatar_url, gm.role
  order by total_mg asc, p.username;
$$;

-- ---------- Serie diaria del grupo (gráfico comparativo por día) ----------
-- Cafeína (mg) por día de cada miembro. Cada miembro empieza a contar el día
-- en que entró al grupo (joined_at): antes de esa fecha no tiene serie. El eje
-- va desde la primera entrada (el creador) hasta hoy. Día en zona del cliente.
drop function if exists public.group_daily_series(uuid, text);
create or replace function public.group_daily_series(gid uuid, tz text)
returns table (user_id uuid, username text, display_name text, avatar_url text, day date, mg bigint)
language sql
security definer
set search_path = public
stable
as $$
  with members as (
    select p.id, p.username, p.display_name, p.avatar_url,
      (gm.joined_at at time zone tz)::date as join_day
    from public.group_members gm
    join public.profiles p on p.id = gm.user_id
    where gm.group_id = gid and public.is_group_member(gid, auth.uid())
  ),
  days_list as (
    select generate_series(
      (select min(join_day) from members),
      (now() at time zone tz)::date,
      interval '1 day'
    )::date as day
  ),
  grid as (
    -- Cada miembro solo tiene días desde que entró.
    select m.id, m.username, m.display_name, m.avatar_url, d.day
    from members m cross join days_list d
    where d.day >= m.join_day
  ),
  agg as (
    select
      gm.user_id,
      (c.taken_at at time zone tz)::date as day,
      sum(public.coffee_caffeine_mg(c.type, c.has_caffeine)) as mg
    from public.group_members gm
    join public.coffees c on c.user_id = gm.user_id
      and c.taken_at >= gm.joined_at
    where gm.group_id = gid
    group by gm.user_id, (c.taken_at at time zone tz)::date
  )
  select
    grid.id as user_id,
    grid.username,
    grid.display_name,
    grid.avatar_url,
    grid.day,
    coalesce(agg.mg, 0)::bigint as mg
  from grid
  left join agg on agg.user_id = grid.id and agg.day = grid.day
  order by grid.day, grid.username;
$$;

-- ---------- Mensajes: publicar y listar ----------
create or replace function public.post_group_message(gid uuid, body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  nm text := btrim(body);
begin
  if not public.is_group_member(gid, auth.uid()) then
    raise exception 'No perteneces a este grupo.';
  end if;
  if length(nm) < 1 or length(nm) > 500 then
    raise exception 'El mensaje debe tener entre 1 y 500 caracteres.';
  end if;
  insert into public.group_messages (group_id, user_id, body)
  values (gid, auth.uid(), nm)
  returning id into mid;
  return mid;
end;
$$;

drop function if exists public.list_group_messages(uuid, int);
create or replace function public.list_group_messages(gid uuid, lim int default 100)
returns table (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select m.id, m.user_id, p.username, p.display_name, p.avatar_url, m.body, m.created_at
  from public.group_messages m
  join public.profiles p on p.id = m.user_id
  where m.group_id = gid and public.is_group_member(gid, auth.uid())
  order by m.created_at desc
  limit greatest(lim, 1);
$$;

-- ---------- Gestión de roles y expulsiones ----------
-- Solo el creador (owner) puede nombrar/quitar co-administradores.
create or replace function public.set_member_role(gid uuid, target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.groups where id = gid and owner_id = auth.uid()) then
    raise exception 'Solo el creador puede cambiar roles.';
  end if;
  if target = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol.';
  end if;
  if new_role not in ('coadmin', 'member') then
    raise exception 'Rol no válido.';
  end if;
  if not public.is_group_member(gid, target) then
    raise exception 'Ese usuario no está en el grupo.';
  end if;
  update public.group_members
  set role = new_role
  where group_id = gid and user_id = target and role <> 'owner';
end;
$$;

-- El creador puede expulsar a cualquiera; un co-admin, solo a miembros normales.
create or replace function public.kick_member(gid uuid, target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  target_role text;
begin
  select role into caller_role
  from public.group_members where group_id = gid and user_id = auth.uid();
  if caller_role is null or caller_role not in ('owner', 'coadmin') then
    raise exception 'No tienes permiso para expulsar miembros.';
  end if;
  if target = auth.uid() then
    raise exception 'No puedes expulsarte a ti mismo.';
  end if;
  select role into target_role
  from public.group_members where group_id = gid and user_id = target;
  if target_role is null then
    raise exception 'Ese usuario no está en el grupo.';
  end if;
  if target_role = 'owner' then
    raise exception 'No se puede expulsar al creador del grupo.';
  end if;
  if caller_role = 'coadmin' and target_role = 'coadmin' then
    raise exception 'Solo el creador puede expulsar a un co-administrador.';
  end if;
  delete from public.group_members where group_id = gid and user_id = target;
  delete from public.group_invitations where group_id = gid and invitee_id = target;
end;
$$;

-- ---------- Permisos ----------
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.my_groups(text) to authenticated;
grant execute on function public.group_ranking(uuid, text) to authenticated;
grant execute on function public.group_daily_series(uuid, text) to authenticated;
grant execute on function public.post_group_message(uuid, text) to authenticated;
grant execute on function public.list_group_messages(uuid, int) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.kick_member(uuid, uuid) to authenticated;
