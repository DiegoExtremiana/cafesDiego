import { supabase } from '@/lib/supabase';
import type { Cigarette } from '@/types/cigarette';
import type { CigaretteRow } from '@/types/database';

function mapCigarette(row: CigaretteRow): Cigarette {
  return {
    id: row.id,
    userId: row.user_id,
    smokedAt: new Date(row.smoked_at),
  };
}

/** Todos los cigarros del usuario en orden cronológico ascendente. */
export async function listCigarettes(userId: string): Promise<Cigarette[]> {
  const { data, error } = await supabase
    .from('cigarettes')
    .select('*')
    .eq('user_id', userId)
    .order('smoked_at', { ascending: true });
  if (error) throw new Error(`No se pudieron cargar los cigarros: ${error.message}`);
  return data.map(mapCigarette);
}

export async function addCigarette(userId: string, smokedAt: Date): Promise<Cigarette> {
  const { data, error } = await supabase
    .from('cigarettes')
    .insert({ user_id: userId, smoked_at: smokedAt.toISOString() })
    .select()
    .single();
  if (error) throw new Error(`No se pudo registrar el cigarro: ${error.message}`);
  return mapCigarette(data);
}

export async function updateCigarette(id: string, smokedAt: Date): Promise<Cigarette> {
  const { data, error } = await supabase
    .from('cigarettes')
    .update({ smoked_at: smokedAt.toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`No se pudo actualizar el cigarro: ${error.message}`);
  return mapCigarette(data);
}

export async function deleteCigarette(id: string): Promise<void> {
  const { error } = await supabase.from('cigarettes').delete().eq('id', id);
  if (error) throw new Error(`No se pudo eliminar el cigarro: ${error.message}`);
}
