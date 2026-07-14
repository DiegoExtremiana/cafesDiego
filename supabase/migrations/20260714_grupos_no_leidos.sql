-- =============================================================
-- Mensajes de grupo no leídos.
-- Registra por (grupo, usuario) el momento de la última lectura y expone el
-- recuento de mensajes sin leer de cada grupo del usuario (mensajes de OTROS
-- posteriores a la última lectura, o a su entrada al grupo si nunca ha leído).
-- Acceso solo por RPCs SECURITY DEFINER (RLS sin políticas).
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 20260713_grupos_interfaz.sql.
-- =============================================================

-- ---------- Marca de última lectura por miembro y grupo ----------
create table if not exists public.group_reads (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_reads enable row level security;
-- Sin políticas a propósito: acceso solo por las funciones de abajo.

-- ---------- Recuento de no leídos por grupo ----------
-- Una fila por cada grupo del usuario (unread = 0 si no hay nada nuevo).
create or replace function public.group_unread_counts()
returns table (group_id uuid, unread int)
language sql
security definer
set search_path = public
stable
as $$
  select
    gm.group_id,
    count(m.id)::int as unread
  from public.group_members gm
  left join public.group_reads gr
    on gr.group_id = gm.group_id and gr.user_id = gm.user_id
  left join public.group_messages m
    on m.group_id = gm.group_id
    and m.user_id <> gm.user_id
    -- Cuenta desde la última lectura; si nunca ha leído, desde que entró.
    and m.created_at > coalesce(gr.last_read_at, gm.joined_at)
  where gm.user_id = auth.uid()
  group by gm.group_id;
$$;

-- ---------- Marcar un grupo como leído (hasta ahora) ----------
create or replace function public.mark_group_read(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(gid, auth.uid()) then
    raise exception 'No perteneces a este grupo.';
  end if;
  insert into public.group_reads (group_id, user_id, last_read_at)
  values (gid, auth.uid(), now())
  on conflict (group_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

-- ---------- Permisos ----------
grant execute on function public.group_unread_counts() to authenticated;
grant execute on function public.mark_group_read(uuid) to authenticated;
