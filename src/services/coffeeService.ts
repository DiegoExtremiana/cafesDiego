import { supabase } from '@/lib/supabase';
import type { Coffee, CoffeeDetails, CoffeeType } from '@/types/coffee';
import type { CoffeeRow } from '@/types/database';

function mapCoffee(row: CoffeeRow): Coffee {
  return {
    id: row.id,
    userId: row.user_id,
    takenAt: new Date(row.taken_at),
    type: row.type as CoffeeType,
    hasCaffeine: row.has_caffeine,
  };
}

/** Todos los cafés del usuario en orden cronológico ascendente. */
export async function listCoffees(userId: string): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from('coffees')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: true });
  if (error) throw new Error(`No se pudieron cargar los cafés: ${error.message}`);
  return data.map(mapCoffee);
}

export async function addCoffee(
  userId: string,
  takenAt: Date,
  details?: CoffeeDetails,
): Promise<Coffee> {
  const { data, error } = await supabase
    .from('coffees')
    .insert({
      user_id: userId,
      taken_at: takenAt.toISOString(),
      ...(details && { type: details.type, has_caffeine: details.hasCaffeine }),
    })
    .select()
    .single();
  if (error) throw new Error(`No se pudo registrar el café: ${error.message}`);
  return mapCoffee(data);
}

export async function updateCoffee(id: string, takenAt: Date): Promise<Coffee> {
  const { data, error } = await supabase
    .from('coffees')
    .update({ taken_at: takenAt.toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`No se pudo actualizar el café: ${error.message}`);
  return mapCoffee(data);
}

export async function deleteCoffee(id: string): Promise<void> {
  const { error } = await supabase.from('coffees').delete().eq('id', id);
  if (error) throw new Error(`No se pudo eliminar el café: ${error.message}`);
}
