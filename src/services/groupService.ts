import { supabase } from '@/lib/supabase';
import type { Group, GroupInvitation, RankingEntry, WeeklySeriesPoint } from '@/types/group';

/** Zona horaria del navegador, para cortar día/semana en el servidor. */
function clientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export async function createGroup(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_group', { group_name: name });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase.rpc('my_groups');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    memberCount: row.member_count as number,
    createdAt: new Date(row.created_at as string),
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
    todayMg: Number(row.today_mg),
    weekMg: Number(row.week_mg),
    totalMg: Number(row.total_mg),
    todayDrinks: Number(row.today_drinks),
    weekDrinks: Number(row.week_drinks),
    totalDrinks: Number(row.total_drinks),
  }));
}

export async function getGroupWeeklySeries(
  groupId: string,
  weeks = 26,
): Promise<WeeklySeriesPoint[]> {
  const { data, error } = await supabase.rpc('group_weekly_series', {
    gid: groupId,
    tz: clientTimezone(),
    weeks,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    weekStart: row.week_start as string,
    mg: Number(row.mg),
  }));
}
