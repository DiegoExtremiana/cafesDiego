import { supabase } from '@/lib/supabase';
import type { Profile, ProfileSettings } from '@/types/profile';
import type { ProfileRow, ProfileUpdate } from '@/types/database';

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    workStart: row.work_start.slice(0, 5),
    workEnd: row.work_end.slice(0, 5),
    workDays: row.work_days,
    maxDailyCoffees: row.max_daily_coffees,
    maxDailyCaffeine: row.max_daily_caffeine,
    // Tolerante a la migración pendiente: sin columna, se asume el modo por defecto.
    caffeineLimitUnit: row.caffeine_limit_unit === 'mg' ? 'mg' : 'cafes',
    avatarUrl: row.avatar_url ?? null,
    isPublic: row.is_public,
    showHistory: row.show_history,
    showCharts: row.show_charts,
    showAchievements: row.show_achievements,
    showAdvancedStats: row.show_advanced_stats,
    createdAt: new Date(row.created_at),
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
  return data ? mapProfile(data) : null;
}

/** Busca un perfil público por su nombre de usuario. */
export async function getPublicProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('is_public', true)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el perfil público: ${error.message}`);
  return data ? mapProfile(data) : null;
}

export async function updateProfile(
  userId: string,
  settings: Partial<ProfileSettings>,
): Promise<Profile> {
  const update: ProfileUpdate = {};
  if (settings.username !== undefined) update.username = settings.username.toLowerCase();
  if (settings.displayName !== undefined) update.display_name = settings.displayName;
  if (settings.workStart !== undefined) update.work_start = settings.workStart;
  if (settings.workEnd !== undefined) update.work_end = settings.workEnd;
  if (settings.workDays !== undefined) update.work_days = settings.workDays;
  if (settings.maxDailyCoffees !== undefined) update.max_daily_coffees = settings.maxDailyCoffees;
  if (settings.maxDailyCaffeine !== undefined)
    update.max_daily_caffeine = settings.maxDailyCaffeine;
  if (settings.caffeineLimitUnit !== undefined)
    update.caffeine_limit_unit = settings.caffeineLimitUnit;
  if (settings.avatarUrl !== undefined) update.avatar_url = settings.avatarUrl;
  if (settings.isPublic !== undefined) update.is_public = settings.isPublic;
  if (settings.showHistory !== undefined) update.show_history = settings.showHistory;
  if (settings.showCharts !== undefined) update.show_charts = settings.showCharts;
  if (settings.showAchievements !== undefined) update.show_achievements = settings.showAchievements;
  if (settings.showAdvancedStats !== undefined)
    update.show_advanced_stats = settings.showAdvancedStats;

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese nombre de usuario ya está en uso.');
    }
    throw new Error(`No se pudo guardar el perfil: ${error.message}`);
  }
  return mapProfile(data);
}
