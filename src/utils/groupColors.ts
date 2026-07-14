/**
 * Paleta de colores por miembro de un grupo. El servidor asigna un color_index
 * estable (0..N-1, orden por username) que devuelven list_group_messages y
 * group_daily_series, de modo que el color del nombre en el chat coincide con
 * el de su línea en el gráfico y no se repite dentro del grupo (hasta agotar la
 * paleta, momento en el que se cicla).
 */
export const GROUP_PALETTE = [
  '#9c6f44', // coffee
  '#22c55e', // green
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#a855f7', // purple
  '#14b8a6', // teal
  '#ec4899', // pink
  '#6b472c', // coffeeDark
  '#84cc16', // lime
  '#0ea5e9', // sky
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#d946ef', // fuchsia
  '#64748b', // slate
] as const;

const FALLBACK = GROUP_PALETTE[0];

/** Color de un miembro a partir de su color_index (cicla si se agota la paleta). */
export function colorForIndex(index: number | null | undefined): string {
  if (index == null || index < 0) return FALLBACK;
  return GROUP_PALETTE[index % GROUP_PALETTE.length] ?? FALLBACK;
}
