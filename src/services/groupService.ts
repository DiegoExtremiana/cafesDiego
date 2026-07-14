import { supabase } from '@/lib/supabase';
import type {
  DailySeriesPoint,
  Group,
  GroupInvitation,
  GroupMessage,
  GroupNameRequest,
  GroupRole,
  RankingEntry,
  UserSearchResult,
} from '@/types/group';

/** Zona horaria del navegador, para cortar día/semana en el servidor. */
function clientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function asRole(value: unknown): GroupRole {
  return value === 'owner' || value === 'coadmin' ? value : 'member';
}

export async function createGroup(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_group', { group_name: name });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase.rpc('my_groups', { tz: clientTimezone() });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    memberCount: row.member_count as number,
    myRole: asRole(row.my_role),
    myRank: Number(row.my_rank ?? 0),
    createdAt: new Date(row.created_at as string),
  }));
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase.rpc('search_users', { q });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    username: row.username as string,
    displayName: (row.display_name as string) ?? '',
    avatarUrl: (row.avatar_url as string) ?? null,
    isPublic: Boolean(row.is_public),
  }));
}

export async function inviteToGroup(groupId: string, username: string): Promise<void> {
  const { error } = await supabase.rpc('invite_to_group', {
    gid: groupId,
    invitee_username: username,
  });
  if (error) throw new Error(error.message);
}

export async function listMyInvitations(): Promise<GroupInvitation[]> {
  const { data, error } = await supabase.rpc('my_invitations');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    groupId: row.group_id as string,
    groupName: row.group_name as string,
    inviterUsername: row.inviter_username as string,
    inviterDisplayName: row.inviter_display_name as string,
    createdAt: new Date(row.created_at as string),
  }));
}

export async function countPendingInvitations(): Promise<number> {
  const { data, error } = await supabase.rpc('count_pending_invitations');
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export async function respondInvitation(invitationId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_invitation', {
    invitation_id: invitationId,
    accept,
  });
  if (error) throw new Error(error.message);
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_group', { gid: groupId });
  if (error) throw new Error(error.message);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_group', { gid: groupId });
  if (error) throw new Error(error.message);
}

export async function setMemberRole(
  groupId: string,
  userId: string,
  role: 'coadmin' | 'member',
): Promise<void> {
  const { error } = await supabase.rpc('set_member_role', {
    gid: groupId,
    target: userId,
    new_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function kickMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('kick_member', { gid: groupId, target: userId });
  if (error) throw new Error(error.message);
}

export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('group_ranking', {
    gid: groupId,
    tz: clientTimezone(),
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    isPublic: Boolean(row.is_public),
    role: asRole(row.role),
    todayMg: Number(row.today_mg),
    weekMg: Number(row.week_mg),
    totalMg: Number(row.total_mg),
    todayDrinks: Number(row.today_drinks),
    weekDrinks: Number(row.week_drinks),
    totalDrinks: Number(row.total_drinks),
  }));
}

export async function getGroupDailySeries(groupId: string): Promise<DailySeriesPoint[]> {
  const { data, error } = await supabase.rpc('group_daily_series', {
    gid: groupId,
    tz: clientTimezone(),
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    isPublic: Boolean(row.is_public),
    day: row.day as string,
    mg: Number(row.mg),
  }));
}

export async function listGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase.rpc('list_group_messages', { gid: groupId });
  if (error) throw new Error(error.message);
  // El RPC devuelve del más reciente al más antiguo; se invierte para el chat.
  return (data ?? [])
    .map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      username: row.username as string,
      displayName: (row.display_name as string) ?? '',
      avatarUrl: (row.avatar_url as string) ?? null,
      isPublic: Boolean(row.is_public),
      body: row.body as string,
      createdAt: new Date(row.created_at as string),
    }))
    .reverse();
}

export async function postGroupMessage(groupId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('post_group_message', { gid: groupId, body });
  if (error) throw new Error(error.message);
}

/** Renombra el grupo al instante (solo owner/coadmin). */
export async function renameGroup(groupId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('rename_group', { gid: groupId, new_name: name });
  if (error) throw new Error(error.message);
}

/** Propone un nombre; si eres owner/coadmin renombra, si no deja una solicitud. */
export async function proposeGroupName(groupId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('propose_group_name', { gid: groupId, new_name: name });
  if (error) throw new Error(error.message);
}

/** Nombre propuesto por el usuario actual que sigue pendiente, o null. */
export async function getMyPendingNameRequest(groupId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('my_pending_name_request', { gid: groupId });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

/** Solicitudes de cambio de nombre pendientes (solo owner/coadmin). */
export async function listGroupNameRequests(groupId: string): Promise<GroupNameRequest[]> {
  const { data, error } = await supabase.rpc('list_group_name_requests', { gid: groupId });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    requestedBy: row.requested_by as string,
    username: row.username as string,
    displayName: (row.display_name as string) ?? '',
    avatarUrl: (row.avatar_url as string) ?? null,
    proposedName: row.proposed_name as string,
    createdAt: new Date(row.created_at as string),
  }));
}

/** Aprueba (renombra) o rechaza una solicitud de cambio de nombre. */
export async function respondGroupNameRequest(
  requestId: string,
  approve: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('respond_group_name_request', {
    req_id: requestId,
    approve,
  });
  if (error) throw new Error(error.message);
}

/** Mensajes sin leer por grupo del usuario, como { groupId: nº }. */
export async function getGroupUnreadCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('group_unread_counts');
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    counts[row.group_id as string] = Number(row.unread ?? 0);
  }
  return counts;
}

/** Marca un grupo como leído hasta este momento. */
export async function markGroupRead(groupId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_group_read', { gid: groupId });
  if (error) throw new Error(error.message);
}
