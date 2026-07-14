-- =============================================================
-- Mensajes de sistema en el chat + color estable por miembro.
-- - group_messages.kind ('user' | 'system'): los eventos del grupo (entrar,
--   salir, renombrar) se registran como mensajes 'system' en el chat. Al
--   insertarse disparan el trigger de broadcast y cuentan como no leídos, así
--   que se notifican como cualquier mensaje.
-- - color_index estable por miembro y grupo (row_number sobre username): lo
--   devuelven list_group_messages y group_daily_series para que el color del
--   nombre en el chat coincida con el de su línea en el gráfico y no se repita.
--
-- EJECUTAR EL ÚLTIMO (después de 20260714_grupos_nombre.sql y 20260713_*),
-- porque re-crea funciones definidas en esas migraciones.
-- =============================================================

-- ---------- Tipo de mensaje ----------
alter table public.group_messages
  add column if not exists kind text not null default 'user'
  check (kind in ('user', 'system'));

-- ---------- Listar mensajes (ahora con kind y color_index del autor) ----------
drop function if exists public.list_group_messages(uuid, int);
create or replace function public.list_group_messages(gid uuid, lim int default 100)
returns table (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_public boolean,
  body text,
  kind text,
  color_index int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with members as (
    -- Color estable: orden por username (único), 0..N-1. Igual criterio que en
    -- group_daily_series, así el color del chat coincide con el del gráfico.
    select gm.user_id, (row_number() over (order by p2.username) - 1)::int as color_index
    from public.group_members gm
    join public.profiles p2 on p2.id = gm.user_id
    where gm.group_id = gid
  )
  select m.id, m.user_id, p.username, p.display_name, p.avatar_url, p.is_public, m.body, m.kind,
    mem.color_index, m.created_at
  from public.group_messages m
  join public.profiles p on p.id = m.user_id
  left join members mem on mem.user_id = m.user_id
  where m.group_id = gid and public.is_group_member(gid, auth.uid())
  order by m.created_at desc
  limit greatest(lim, 1);
$$;
grant execute on function public.list_group_messages(uuid, int) to authenticated;

-- ---------- Serie diaria (ahora con color_index por miembro) ----------
drop function if exists public.group_daily_series(uuid, text);
create or replace function public.group_daily_series(gid uuid, tz text)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_public boolean,
  color_index int,
  day date,
  mg bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with members as (
    select p.id, p.username, p.display_name, p.avatar_url, p.is_public,
      (gm.joined_at at time zone tz)::date as join_day,
      (row_number() over (order by p.username) - 1)::int as color_index
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
    select m.id, m.username, m.display_name, m.avatar_url, m.is_public, m.color_index, d.day
    from members m cross join days_list d
    where d.day >= m.join_day
  ),
  agg as (
    select
      gm.user_id,
      (c.taken_at at time zone tz)::date as day,
      sum(public.coffee_caffeine_mg(c.type, c.has_caffeine)) as mg
    from public.group_members gm
    join public.coffees c on c.user_id = gm.user_id and c.taken_at >= gm.joined_at
    where gm.group_id = gid
    group by gm.user_id, (c.taken_at at time zone tz)::date
  )
  select
    grid.id as user_id,
    grid.username,
    grid.display_name,
    grid.avatar_url,
    grid.is_public,
    grid.color_index,
    grid.day,
    coalesce(agg.mg, 0)::bigint as mg
  from grid
  left join agg on agg.user_id = grid.id and agg.day = grid.day
  order by grid.day, grid.username;
$$;
grant execute on function public.group_daily_series(uuid, text) to authenticated;

-- ---------- Nombre visible del usuario (para los mensajes de sistema) ----------
create or replace function public.display_name_of(uid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(nullif(btrim(display_name), ''), username)
  from public.profiles where id = uid;
$$;

-- ---------- Aceptar/rechazar invitación (+ "ha entrado a «grupo»") ----------
create or replace function public.respond_invitation(invitation_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.group_invitations;
  gname text;
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
    select name into gname from public.groups where id = inv.group_id;
    insert into public.group_messages (group_id, user_id, body, kind)
    values (
      inv.group_id,
      auth.uid(),
      public.display_name_of(auth.uid()) || ' ha entrado a «' || coalesce(gname, '') || '».',
      'system'
    );
  else
    update public.group_invitations set status = 'declined' where id = invitation_id;
  end if;
end;
$$;

-- ---------- Salir del grupo (+ "ha salido de «grupo»") ----------
create or replace function public.leave_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gname text;
begin
  if exists (select 1 from public.groups where id = gid and owner_id = auth.uid()) then
    raise exception 'Eres el propietario: elimina el grupo en su lugar.';
  end if;
  if not public.is_group_member(gid, auth.uid()) then
    return;
  end if;
  select name into gname from public.groups where id = gid;
  insert into public.group_messages (group_id, user_id, body, kind)
  values (
    gid,
    auth.uid(),
    public.display_name_of(auth.uid()) || ' ha salido de «' || coalesce(gname, '') || '».',
    'system'
  );
  delete from public.group_members where group_id = gid and user_id = auth.uid();
end;
$$;

-- ---------- Renombrar (+ "ha cambiado «A» a «B»") ----------
-- Publica el mensaje de sistema solo si el nombre cambia de verdad.
create or replace function public.rename_group(gid uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  nm text := btrim(new_name);
  oldname text;
begin
  if not public.is_group_admin(gid, auth.uid()) then
    raise exception 'Solo el creador o un co-administrador puede cambiar el nombre.';
  end if;
  if length(nm) < 1 or length(nm) > 40 then
    raise exception 'El nombre debe tener entre 1 y 40 caracteres.';
  end if;
  select name into oldname from public.groups where id = gid;
  if oldname is distinct from nm then
    update public.groups set name = nm where id = gid;
    insert into public.group_messages (group_id, user_id, body, kind)
    values (
      gid,
      auth.uid(),
      public.display_name_of(auth.uid()) || ' ha cambiado «' || oldname || '» a «' || nm || '».',
      'system'
    );
  end if;
end;
$$;

-- ---------- Proponer nombre (owner/coadmin renombra vía rename_group) ----------
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
    perform public.rename_group(gid, nm); -- renombra + mensaje de sistema
    return;
  end if;
  delete from public.group_name_requests
  where group_id = gid and requested_by = auth.uid() and status = 'pending';
  insert into public.group_name_requests (group_id, requested_by, proposed_name)
  values (gid, auth.uid(), nm);
end;
$$;

-- ---------- Resolver solicitud (aprobar renombra vía rename_group) ----------
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
    perform public.rename_group(gid, nm); -- renombra + mensaje de sistema + broadcast
    update public.group_name_requests
    set status = 'approved', resolved_by = auth.uid(), resolved_at = now()
    where id = req_id;
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

-- Solo uso interno de las funciones de arriba (que corren como definer); los
-- clientes no deben poder consultar el nombre de cualquier usuario por id.
revoke execute on function public.display_name_of(uuid) from public;
