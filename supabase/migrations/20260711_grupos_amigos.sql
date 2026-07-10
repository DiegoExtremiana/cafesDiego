-- =============================================================
-- Grupos y amigos: invitaciones + ranking de consumo por grupo.
-- Todo el acceso entre usuarios pasa por funciones SECURITY DEFINER
-- (evita la recursión de RLS y no expone los cafés crudos de otros).
-- Las tablas tienen RLS activada SIN políticas: acceso solo vía RPC.
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================

-- ---------- Tablas ----------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 40),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (group_id, invitee_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_invitations_invitee_idx
  on public.group_invitations (invitee_id, status);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
-- Sin políticas a propósito: el acceso se hace por las funciones de abajo.

-- ---------- Cafeína por bebida (mg) ----------
-- MANTENER SINCRONIZADO con COFFEE_TYPE_CAFFEINE_MG de src/types/coffee.ts.
create or replace function public.coffee_caffeine_mg(p_type text, p_has_caffeine boolean)
returns int
language sql
immutable
as $$
  select case
    when not p_has_caffeine then 0
    when p_type in ('espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro') then 63
    when p_type = 'energetica' then 80
    when p_type = 'te_negro' then 47
    when p_type = 'te_verde' then 28
    when p_type = 'matcha' then 64
    when p_type = 'cola' then 34
    else 0 -- zumo, leche, infusion, cerveza
  end;
$$;

-- ---------- Helper de pertenencia ----------
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members where group_id = gid and user_id = uid
  );
$$;

-- ---------- Crear grupo ----------
create or replace function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  nm text := btrim(group_name);
begin
  if length(nm) < 1 or length(nm) > 40 then
    raise exception 'El nombre del grupo debe tener entre 1 y 40 caracteres.';
  end if;
  insert into public.groups (name, owner_id) values (nm, auth.uid()) returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end;
$$;

-- ---------- Mis grupos ----------
create or replace function public.my_groups()
returns table (id uuid, name text, owner_id uuid, member_count int, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    g.id,
    g.name,
    g.owner_id,
    (select count(*)::int from public.group_members m where m.group_id = g.id),
    g.created_at
  from public.groups g
  join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
  order by g.created_at desc;
$$;

-- ---------- Invitar por nombre de usuario ----------
create or replace function public.invite_to_group(gid uuid, invitee_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitee uuid;
begin
  if not public.is_group_member(gid, auth.uid()) then
    raise exception 'No perteneces a este grupo.';
  end if;
  select id into invitee from public.profiles where username = lower(btrim(invitee_username));
  if invitee is null then
    raise exception 'No existe ningún usuario con ese nombre.';
  end if;
  if invitee = auth.uid() then
    raise exception 'No puedes invitarte a ti mismo.';
  end if;
  if public.is_group_member(gid, invitee) then
    raise exception 'Ese usuario ya está en el grupo.';
  end if;
  insert into public.group_invitations (group_id, inviter_id, invitee_id, status)
  values (gid, auth.uid(), invitee, 'pending')
  on conflict (group_id, invitee_id)
  do update set status = 'pending', inviter_id = excluded.inviter_id, created_at = now();
end;
$$;

-- ---------- Mis invitaciones pendientes ----------
create or replace function public.my_invitations()
returns table (
  id uuid,
  group_id uuid,
  group_name text,
  inviter_username text,
  inviter_display_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select i.id, i.group_id, g.name, p.username, p.display_name, i.created_at
  from public.group_invitations i
  join public.groups g on g.id = i.group_id
  join public.profiles p on p.id = i.inviter_id
  where i.invitee_id = auth.uid() and i.status = 'pending'
  order by i.created_at desc;
$$;

create or replace function public.count_pending_invitations()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.group_invitations
  where invitee_id = auth.uid() and status = 'pending';
$$;

-- ---------- Responder invitación ----------
create or replace function public.respond_invitation(invitation_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.group_invitations;
begin
  select * into inv from public.group_invitations
  where id = invitation_id and invitee_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Invitación no encontrada o ya respondida.';
  end if;
  if accept then
    insert into public.group_members (group_id, user_id)
    values (inv.group_id, auth.uid())
    on conflict do nothing;
    update public.group_invitations set status = 'accepted' where id = invitation_id;
  else
    update public.group_invitations set status = 'declined' where id = invitation_id;
  end if;
end;
$$;

-- ---------- Salir / eliminar grupo ----------
create or replace function public.leave_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.groups where id = gid and owner_id = auth.uid()) then
    raise exception 'Eres el propietario: elimina el grupo en su lugar.';
  end if;
  delete from public.group_members where group_id = gid and user_id = auth.uid();
end;
$$;

create or replace function public.delete_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.groups where id = gid and owner_id = auth.uid()) then
    raise exception 'Solo el propietario puede eliminar el grupo.';
  end if;
  delete from public.groups where id = gid; -- cascada a miembros e invitaciones
end;
$$;

-- ---------- Ranking del grupo ----------
-- Devuelve, por miembro, la cafeína (mg) y el nº de bebidas de hoy, la semana
-- y el histórico. Los cortes de día/semana usan la zona horaria del cliente.
create or replace function public.group_ranking(gid uuid, tz text)
returns table (
  user_id uuid,
  username text,
  display_name text,
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
  ) m on true
  where gm.group_id = gid
    and public.is_group_member(gid, auth.uid())
  group by p.id, p.username, p.display_name
  order by total_mg desc, p.username;
$$;

-- ---------- Serie semanal del grupo (para el gráfico comparativo) ----------
-- Cafeína (mg) por semana de cada miembro en las últimas `weeks` semanas,
-- rellenando con 0 las semanas sin registros. Semana ISO (lunes) en la zona
-- horaria del cliente.
create or replace function public.group_weekly_series(gid uuid, tz text, weeks int default 12)
returns table (user_id uuid, username text, display_name text, week_start date, mg bigint)
language sql
security definer
set search_path = public
stable
as $$
  with members as (
    select p.id, p.username, p.display_name
    from public.group_members gm
    join public.profiles p on p.id = gm.user_id
    where gm.group_id = gid and public.is_group_member(gid, auth.uid())
  ),
  weeks_list as (
    select generate_series(
      date_trunc('week', now() at time zone tz)::date - ((greatest(weeks, 1) - 1) * 7),
      date_trunc('week', now() at time zone tz)::date,
      interval '7 days'
    )::date as week_start
  ),
  grid as (
    select m.id, m.username, m.display_name, w.week_start
    from members m cross join weeks_list w
  ),
  agg as (
    select
      gm.user_id,
      date_trunc('week', c.taken_at at time zone tz)::date as week_start,
      sum(public.coffee_caffeine_mg(c.type, c.has_caffeine)) as mg
    from public.group_members gm
    join public.coffees c on c.user_id = gm.user_id
    where gm.group_id = gid
    group by gm.user_id, date_trunc('week', c.taken_at at time zone tz)::date
  )
  select
    grid.id as user_id,
    grid.username,
    grid.display_name,
    grid.week_start,
    coalesce(agg.mg, 0)::bigint as mg
  from grid
  left join agg on agg.user_id = grid.id and agg.week_start = grid.week_start
  order by grid.week_start, grid.username;
$$;

grant execute on function public.create_group(text) to authenticated;
grant execute on function public.my_groups() to authenticated;
grant execute on function public.invite_to_group(uuid, text) to authenticated;
grant execute on function public.my_invitations() to authenticated;
grant execute on function public.count_pending_invitations() to authenticated;
grant execute on function public.respond_invitation(uuid, boolean) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.delete_group(uuid) to authenticated;
grant execute on function public.group_ranking(uuid, text) to authenticated;
