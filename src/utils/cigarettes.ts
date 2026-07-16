/** Estadísticas de cigarros: funciones puras sobre la lista de cigarros
 * (siempre ordenada de forma ascendente por smokedAt). */
import type { Cigarette } from '@/types/cigarette';
import { minutesBetween, toDateKey } from './dates';

/** Etiqueta singular/plural para un número de cigarros. */
export function cigaretteLabel(count: number): string {
  return count === 1 ? 'cigarro' : 'cigarros';
}

/** Agrupa los cigarros por día local. */
export function cigarettesByDay(cigarettes: Cigarette[]): Map<string, Cigarette[]> {
  const groups = new Map<string, Cigarette[]>();
  for (const cigarette of cigarettes) {
    const key = toDateKey(cigarette.smokedAt);
    const group = groups.get(key);
    if (group) group.push(cigarette);
    else groups.set(key, [cigarette]);
  }
  return groups;
}

/** Cigarros de un día concreto, en orden ascendente. */
export function cigarettesOfDay(cigarettes: Cigarette[], date: Date): Cigarette[] {
  const key = toDateKey(date);
  return cigarettes.filter((cigarette) => toDateKey(cigarette.smokedAt) === key);
}

export interface CigaretteDashboardStats {
  todayCount: number;
  /** Minutos desde el último cigarro (de cualquier día); null si no hay ninguno. */
  minutesSinceLast: number | null;
  /** Media de cigarros por día registrado (días con al menos uno); null si no hay datos. */
  dailyAvg: number | null;
}

export function computeCigaretteStats(cigarettes: Cigarette[], now: Date): CigaretteDashboardStats {
  const todayCount = cigarettesOfDay(cigarettes, now).length;
  const last = cigarettes.at(-1) ?? null;
  const days = cigarettesByDay(cigarettes).size;
  return {
    todayCount,
    minutesSinceLast: last ? minutesBetween(last.smokedAt, now) : null,
    dailyAvg: days > 0 ? cigarettes.length / days : null,
  };
}
