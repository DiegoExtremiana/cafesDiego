/** Preparación de datos para los gráficos, a partir de la lista de cafés. */
import type { Coffee } from '@/types/coffee';
import {
  DAY_MS,
  addDays,
  formatMonthName,
  hourLabel,
  startOfDay,
  startOfWeek,
  toDateKey,
  toMonthKey,
} from './dates';
import { groupByDay, intraDayIntervals } from './stats';

export interface SeriesPoint {
  key: string;
  label: string;
  count: number;
}

const shortDayFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const shortMonthFormat = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' });

/** Días transcurridos desde el primer café registrado (incluido hoy). */
function daysSinceFirst(coffees: Coffee[], now: Date): number {
  if (coffees.length === 0) return 0;
  const first = coffees[0];
  if (!first) return 0;
  return Math.floor((startOfDay(now).getTime() - startOfDay(first.takenAt).getTime()) / DAY_MS) + 1;
}

/** Meses transcurridos desde el primer café registrado (incluido el actual). */
function monthsSinceFirst(coffees: Coffee[], now: Date): number {
  if (coffees.length === 0) return 0;
  const first = coffees[0];
  if (!first) return 0;
  const takenAt = first.takenAt;
  return (now.getFullYear() - takenAt.getFullYear()) * 12 + (now.getMonth() - takenAt.getMonth()) + 1;
}

/** Cafés por día en los últimos `days` días (incluye días a cero). `'all'` cubre todo el histórico. */
export function dailySeries(coffees: Coffee[], now: Date, days: number | 'all' = 30): SeriesPoint[] {
  const resolvedDays = days === 'all' ? Math.max(30, daysSinceFirst(coffees, now)) : days;
  const counts = new Map<string, number>();
  for (const [key, group] of groupByDay(coffees)) counts.set(key, group.length);

  const points: SeriesPoint[] = [];
  for (let i = resolvedDays - 1; i >= 0; i--) {
    const date = addDays(now, -i);
    const key = toDateKey(date);
    points.push({ key, label: shortDayFormat.format(date), count: counts.get(key) ?? 0 });
  }
  return points;
}

/** Cafés por semana en las últimas `weeks` semanas. `'all'` cubre todo el histórico. */
export function weeklySeries(coffees: Coffee[], now: Date, weeks: number | 'all' = 12): SeriesPoint[] {
  const resolvedWeeks =
    weeks === 'all' ? Math.max(12, Math.ceil(daysSinceFirst(coffees, now) / 7)) : weeks;
  const counts = new Map<string, number>();
  for (const coffee of coffees) {
    const key = toDateKey(startOfWeek(coffee.takenAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: SeriesPoint[] = [];
  const currentWeekStart = startOfWeek(now);
  for (let i = resolvedWeeks - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const key = toDateKey(weekStart);
    points.push({
      key,
      label: shortDayFormat.format(weekStart),
      count: counts.get(key) ?? 0,
    });
  }
  return points;
}

/** Cafés por mes en los últimos `months` meses. `'all'` cubre todo el histórico. */
export function monthlySeries(coffees: Coffee[], now: Date, months: number | 'all' = 12): SeriesPoint[] {
  const resolvedMonths = months === 'all' ? Math.max(12, monthsSinceFirst(coffees, now)) : months;
  const counts = new Map<string, number>();
  for (const coffee of coffees) {
    const key = toMonthKey(coffee.takenAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: SeriesPoint[] = [];
  for (let i = resolvedMonths - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(date);
    points.push({ key, label: shortMonthFormat.format(date), count: counts.get(key) ?? 0 });
  }
  return points;
}

/** Distribución de cafés por hora del día (0 a 23). */
export function hourlyDistribution(coffees: Coffee[]): SeriesPoint[] {
  const counts = Array.from({ length: 24 }, () => 0);
  for (const coffee of coffees) {
    const hour = coffee.takenAt.getHours();
    counts[hour] = (counts[hour] ?? 0) + 1;
  }
  return counts.map((count, hour) => ({
    key: String(hour),
    label: hourLabel(hour),
    count,
  }));
}

/** Histograma del tiempo entre cafés del mismo día (tramos de 30 minutos). */
export function intervalHistogram(coffees: Coffee[]): SeriesPoint[] {
  const buckets = [
    { key: '0-30', label: '< 30 min', max: 30 },
    { key: '30-60', label: '30-60 min', max: 60 },
    { key: '60-90', label: '1-1,5 h', max: 90 },
    { key: '90-120', label: '1,5-2 h', max: 120 },
    { key: '120-180', label: '2-3 h', max: 180 },
    { key: '180-240', label: '3-4 h', max: 240 },
    { key: '240+', label: '> 4 h', max: Infinity },
  ];
  const counts = buckets.map(() => 0);
  for (const interval of intraDayIntervals(coffees)) {
    const index = buckets.findIndex((bucket) => interval < bucket.max);
    if (index >= 0) counts[index] = (counts[index] ?? 0) + 1;
  }
  return buckets.map((bucket, index) => ({
    key: bucket.key,
    label: bucket.label,
    count: counts[index] ?? 0,
  }));
}

/** Evolución del promedio de cafés por día registrado en cada mes. `'all'` cubre todo el histórico. */
export function monthlyAverageSeries(coffees: Coffee[], now: Date, months: number | 'all' = 12): SeriesPoint[] {
  const resolvedMonths = months === 'all' ? Math.max(12, monthsSinceFirst(coffees, now)) : months;
  const totals = new Map<string, { count: number; days: Set<string> }>();
  for (const coffee of coffees) {
    const key = toMonthKey(coffee.takenAt);
    const entry = totals.get(key) ?? { count: 0, days: new Set<string>() };
    entry.count++;
    entry.days.add(toDateKey(coffee.takenAt));
    totals.set(key, entry);
  }

  const points: SeriesPoint[] = [];
  for (let i = resolvedMonths - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(date);
    const entry = totals.get(key);
    const avg = entry && entry.days.size > 0 ? entry.count / entry.days.size : 0;
    points.push({
      key,
      label: shortMonthFormat.format(date),
      count: Math.round(avg * 100) / 100,
    });
  }
  return points;
}

/** Cafés con cafeína frente a descafeinados. */
export function caffeineBreakdown(coffees: Coffee[]): SeriesPoint[] {
  let caffeine = 0;
  let decaf = 0;
  for (const coffee of coffees) {
    if (coffee.hasCaffeine) caffeine++;
    else decaf++;
  }
  return [
    { key: 'caffeine', label: 'Con cafeína', count: caffeine },
    { key: 'decaf', label: 'Sin cafeína', count: decaf },
  ];
}

export interface CalendarCell {
  dateKey: string;
  count: number;
  /** false para días posteriores a hoy. */
  inRange: boolean;
}

export interface CalendarData {
  /** Columnas de semanas; cada semana tiene 7 celdas (lunes a domingo). */
  weeks: CalendarCell[][];
  /** Etiquetas de mes alineadas con las columnas. */
  monthLabels: { index: number; label: string }[];
}

/** Datos para el calendario tipo GitHub del último año. */
export function calendarData(coffees: Coffee[], now: Date, weekCount = 52): CalendarData {
  const counts = new Map<string, number>();
  for (const [key, group] of groupByDay(coffees)) counts.set(key, group.length);

  const todayKey = toDateKey(now);
  const firstWeekStart = addDays(startOfWeek(now), -7 * (weekCount - 1));

  const weeks: CalendarCell[][] = [];
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = '';

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(firstWeekStart, 7 * w);
    const monthKey = toMonthKey(weekStart);
    if (monthKey !== lastMonth) {
      monthLabels.push({ index: w, label: formatMonthName(monthKey).split(' ')[0] ?? '' });
      lastMonth = monthKey;
    }
    const cells: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      const key = toDateKey(date);
      cells.push({
        dateKey: key,
        count: counts.get(key) ?? 0,
        inRange: key <= todayKey,
      });
    }
    weeks.push(cells);
  }

  return { weeks, monthLabels };
}

/** Color del calendario según el número de cafés (verde, naranja, rojo). */
export function calendarColor(count: number): string {
  if (count === 0) return 'var(--color-coffee-100)';
  if (count === 1) return '#86efac';
  if (count === 2) return '#22c55e';
  if (count === 3) return '#f97316';
  return '#ef4444';
}
