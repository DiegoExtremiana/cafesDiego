-- =============================================================
-- Tiempo real de grupos vía Realtime Broadcast desde la base de datos.
-- Mantiene el modelo RLS-solo-RPC: los clientes NO leen las tablas de grupo
-- directamente; en su lugar, triggers en la BD emiten mensajes de broadcast a
-- un canal PRIVADO por grupo ('group-<uuid>'). Cada cliente se suscribe a los
-- canales de sus grupos y refresca los datos por RPC al recibir un evento.
--
-- Eventos (todos con event = 'change' y payload.kind):
--   kind='message'  -> nuevo mensaje en el chat        (trigger en group_messages)
--   kind='ranking'  -> un miembro registró/editó café  (trigger en coffees)
--   kind='members'  -> alta/baja/rol de un miembro      (trigger en group_members)
--   kind='group'    -> el grupo cambió de nombre        (trigger en groups)
--
-- La autorización de los canales privados se hace con una política RLS de
-- SELECT sobre realtime.messages: solo los miembros del grupo del topic pueden
-- recibir. Requiere que Realtime esté habilitado en el proyecto.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 20260713_grupos_interfaz.sql.
-- =============================================================

-- ---------- Autorización de los canales privados 'group-<uuid>' ----------
-- realtime.topic() devuelve el topic que se está autorizando. Solo se concede a
-- los miembros del grupo cuyo id va en el topic.
drop policy if exists "group_members_receive_broadcast" on realtime.messages;
create policy "group_members_receive_broadcast"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() ~ '^group-[0-9a-fA-F-]{36}$'
  and public.is_group_member((substring(realtime.topic() from 7))::uuid, auth.uid())
);

-- ---------- Nuevo mensaje de chat -> kind='message' ----------
create or replace function public.tg_broadcast_group_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object('kind', 'message', 'group_id', new.group_id, 'user_id', new.user_id),
    'change',
    'group-' || new.group_id,
    true
  );
  return new;
end;
$$;
drop trigger if exists broadcast_group_message on public.group_messages;
create trigger broadcast_group_message
  after insert on public.group_messages
  for each row execute function public.tg_broadcast_group_message();

-- ---------- Café registrado/editado/borrado -> kind='ranking' ----------
-- El consumo de un usuario afecta al ranking de TODOS sus grupos, así que se
-- emite a cada canal de grupo al que pertenece.
create or replace function public.tg_broadcast_coffee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
  gid uuid;
begin
  for gid in select group_id from public.group_members where user_id = uid loop
    perform realtime.send(
      jsonb_build_object('kind', 'ranking', 'group_id', gid, 'user_id', uid),
      'change',
      'group-' || gid,
      true
    );
  end loop;
  return coalesce(new, old);
end;
$$;
drop trigger if exists broadcast_coffee on public.coffees;
create trigger broadcast_coffee
  after insert or update or delete on public.coffees
  for each row execute function public.tg_broadcast_coffee();

-- ---------- Alta/baja/cambio de rol de un miembro -> kind='members' ----------
create or replace function public.tg_broadcast_group_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid := coalesce(new.group_id, old.group_id);
begin
  perform realtime.send(
    jsonb_build_object('kind', 'members', 'group_id', gid),
    'change',
    'group-' || gid,
    true
  );
  return coalesce(new, old);
end;
$$;
drop trigger if exists broadcast_group_member on public.group_members;
create trigger broadcast_group_member
  after insert or update or delete on public.group_members
  for each row execute function public.tg_broadcast_group_member();

-- ---------- Cambio de nombre del grupo -> kind='group' ----------
create or replace function public.tg_broadcast_group_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object('kind', 'group', 'group_id', new.id, 'name', new.name),
    'change',
    'group-' || new.id,
    true
  );
  return new;
end;
$$;
drop trigger if exists broadcast_group_name on public.groups;
create trigger broadcast_group_name
  after update on public.groups
  for each row when (old.name is distinct from new.name)
  execute function public.tg_broadcast_group_name();
