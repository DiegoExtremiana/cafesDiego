/**
 * Colores por miembro de un grupo. El servidor asigna un color_index estable
 * (0..N-1, orden por username) que devuelven list_group_messages y
 * group_daily_series, de modo que el color del nombre en el chat coincide con
 * el de su línea en el gráfico.
 *
 * La correspondencia índice→color es INYECTIVA para cualquier tamaño de grupo:
 * dos miembros distintos nunca comparten color. Los primeros colores salen de
 * una paleta cuidada; si un grupo tiene más miembros que la paleta, se generan
 * tonos distintos con el ángulo áureo (nunca se cicla la paleta).
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

// Color neutro solo para casos SIN miembro (mensaje 'system' o autor que ya
// salió del grupo). No está en la paleta ni lo genera el ángulo áureo, así que
// nunca coincide con el color de un miembro actual.
const NEUTRAL = '#9ca3af';

/**
 * Color de un miembro a partir de su color_index. Único por índice: la paleta
 * cubre los primeros miembros y el resto usa tonos HSL espaciados por el ángulo
 * áureo (137.5°), que no se repiten. `null`/negativo → color neutro.
 */
export function colorForIndex(index: number | null | undefined): string {
  if (index == null || index < 0) return NEUTRAL;
  if (index < GROUP_PALETTE.length) return GROUP_PALETTE[index] ?? NEUTRAL;
  // Desbordamiento: tono distinto por índice, saturación/luz fijas.
  const hue = ((index - GROUP_PALETTE.length) * 137.508) % 360;
  return `hsl(${hue.toFixed(1)}, 62%, 45%)`;
}
