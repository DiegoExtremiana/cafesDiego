-- =============================================================
-- Cambio de nombre de grupo con aprobación.
-- - El creador (owner) y los co-administradores renombran el grupo al instante.
-- - Un miembro normal puede PROPONER un nombre; queda pendiente hasta que un
--   owner/coadmin lo apruebe o lo rechace.
-- Todo el acceso sigue pasando por RPCs SECURITY DEFINER (RLS sin políticas).
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 20260713_grupos_interfaz.sql.
-- =============================================================

-- ---------- Solicitudes de cambio de nombre ----------
create table if not exists public.group_name_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  proposed_name text not null check (length(btrim(proposed_name)) between 1 and 40),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz
);
create index if not exists group_name_requests_pending_idx
  on public.group_name_requests (group_id) where status = 'pending';
-- Como mucho una solicitud pendiente por miembro y grupo.
create unique index if not exists group_name_requests_one_pending
  on public.group_name_requests (group_id, requested_by) where status = 'pending';
alter table public.group_name_requests enable row level security;
-- Sin políticas a propósito: acceso solo por las funciones de abajo.

-- ---------- ¿El usuario es owner o coadmin del grupo? ----------
create or replace function public.is_group_admin(gid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid and role in ('owner', 'coadmin')
  );
$$;

-- ---------- Renombrar (owner/coadmin, al instante) ----------
create or replace function public.rename_group(gid uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  nm text := btrim(new_name);
begin
  if not public.is_group_admin(gid, auth.uid()) then
    raise exception 'Solo el creador o un co-administrador puede cambiar el nombre.';
  end if;
  if length(nm) < 1 or length(nm) > 40 then
    raise exception 'El nombre debe tener entre 1 y 40 caracteres.';
  end if;
  update public.groups set name = nm where id = gid;
end;
$$;

-- ---------- Proponer nombre (cualquier miembro) ----------
-- Si el que propone es owner/coadmin, renombra directamente. Un miembro normal
-- deja una solicitud pendiente (reemplaza la suya anterior si la hubiera).
create or replace function public.propose_group_name(gid uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  nm text := btrim(new_name);
begin
  if not public.is_group_member(gid, auth.uid()) then
    raise exception 'No perteneces a este grupo.';
  end if;
  if length(nm) < 1 or length(nm) > 40 then
    raise exception 'El nombre debe tener entre 1 y 40 caracteres.';
  end if;
  if public.is_group_admin(gid, auth.uid()) then
    update public.groups set name = nm where id = gid;
    return;
  end if;
  delete from public.group_name_requests
  where group_id = gid and requested_by = auth.uid() and status = 'pending';
  insert into public.group_name_requests (group_id, requested_by, proposed_name)
  values (gid, auth.uid(), nm);
end;
$$;

-- ---------- Mi propuesta pendiente (para el propio miembro) ----------
create or replace function public.my_pending_name_request(gid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select proposed_name
  from public.group_name_requests
  where group_id = gid and requested_by = auth.uid() and status = 'pending'
  order by created_at desc
  limit 1;
$$;

-- ---------- Listar solicitudes pendientes (owner/coadmin) ----------
create or replace function public.list_group_name_requests(gid uuid)
returns table (
  id uuid,
  requested_by uuid,
  username text,
  display_name text,
  avatar_url text,
  proposed_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.requested_by, p.username, p.display_name, p.avatar_url, r.proposed_name, r.created_at
  from public.group_name_requests r
  join public.profiles p on p.id = r.requested_by
  where r.group_id = gid
    and r.status = 'pending'
    and public.is_group_admin(gid, auth.uid())
  order by r.created_at;
$$;

-- ---------- Responder a una solicitud (owner/coadmin) ----------
-- Aprobar: renombra el grupo, marca la solicitud como aprobada y rechaza el
-- resto de pendientes del mismo grupo (quedan obsoletas). Rechazar: solo esa.
create or replace function public.respond_group_name_request(req_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  nm text;
begin
  select group_id, proposed_name into gid, nm
  from public.group_name_requests
  where id = req_id and status = 'pending';
  if gid is null then
    raise exception 'La solicitud ya no existe o ya fue resuelta.';
  end if;
  if not public.is_group_admin(gid, auth.uid()) then
    raise exception 'Solo el creador o un co-administrador puede resolver solicitudes.';
  end if;

  if approve then
    update public.groups set name = nm where id = gid;
    update public.group_name_requests
    set status = 'approved', resolved_by = auth.uid(), resolved_at = now()
    where id = req_id;
    -- El resto de pendientes del grupo quedan obsoletas.
    update public.group_name_requests
    set status = 'rejected', resolved_by = auth.uid(), resolved_at = now()
    where group_id = gid and status = 'pending';
  else
    update public.group_name_requests
    set status = 'rejected', resolved_by = auth.uid(), resolved_at = now()
    where id = req_id;
  end if;
end;
$$;

-- ---------- Permisos ----------
grant execute on function public.is_group_admin(uuid, uuid) to authenticated;
grant execute on function public.rename_group(uuid, text) to authenticated;
grant execute on function public.propose_group_name(uuid, text) to authenticated;
grant execute on function public.my_pending_name_request(uuid) to authenticated;
grant execute on function public.list_group_name_requests(uuid) to authenticated;
grant execute on function public.respond_group_name_request(uuid, boolean) to authenticated;
