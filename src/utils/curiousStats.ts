/** Estadísticas curiosas calculadas sobre todo el histórico. */
import { isCoffeeType, type Coffee } from '@/types/coffee';
import { formatTime, minutesBetween, toDateKey } from './dates';
import { average, groupByDay } from './stats';

export interface DayFact {
  dateKey: string;
  count: number;
}

export interface TimeFact {
  dateKey: string;
  /** Hora en formato HH:MM. */
  time: string;
}

export interface HourFact {
  hour: number;
  count: number;
}

export interface IntervalFact {
  dateKey: string;
  minutes: number;
}

export interface ConsistencyFact {
  dateKey: string;
  /** Desviación típica de los intervalos del día, en minutos. */
  stdDevMinutes: number;
}

export interface CuriousStats {
  earliestCoffee: TimeFact | null;
  latestCoffee: TimeFact | null;
  maxDay: DayFact | null;
  minDay: DayFact | null;
  favoriteHour: HourFact | null;
  leastCommonHour: HourFact | null;
  avgIntervalMinutes: number | null;
  shortestInterval: IntervalFact | null;
  longestInterval: IntervalFact | null;
  mostConsistentDay: ConsistencyFact | null;
  mostIrregularDay: ConsistencyFact | null;
  earliestFirstCoffeeDay: TimeFact | null;
  latestLastCoffeeDay: TimeFact | null;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function stdDev(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeCuriousStats(coffees: Coffee[]): CuriousStats {
  const stats: CuriousStats = {
    earliestCoffee: null,
    latestCoffee: null,
    maxDay: null,
    minDay: null,
    favoriteHour: null,
    leastCommonHour: null,
    avgIntervalMinutes: null,
    shortestInterval: null,
    longestInterval: null,
    mostConsistentDay: null,
    mostIrregularDay: null,
    earliestFirstCoffeeDay: null,
    latestLastCoffeeDay: null,
  };
  if (coffees.length === 0) return stats;

  // Café más temprano y más tarde (por hora del día).
  let earliest = coffees[0]!;
  let latest = coffees[0]!;
  const hourCounts = Array.from({ length: 24 }, () => 0);
  for (const coffee of coffees) {
    if (minutesOfDay(coffee.takenAt) < minutesOfDay(earliest.takenAt)) earliest = coffee;
    if (minutesOfDay(coffee.takenAt) > minutesOfDay(latest.takenAt)) latest = coffee;
    const hour = coffee.takenAt.getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  stats.earliestCoffee = {
    dateKey: toDateKey(earliest.takenAt),
    time: formatTime(earliest.takenAt),
  };
  stats.latestCoffee = {
    dateKey: toDateKey(latest.takenAt),
    time: formatTime(latest.takenAt),
  };

  // Hora favorita y menos habitual (entre las horas con algún café).
  for (let hour = 0; hour < 24; hour++) {
    const count = hourCounts[hour] ?? 0;
    if (count === 0) continue;
    if (!stats.favoriteHour || count > stats.favoriteHour.count) {
      stats.favoriteHour = { hour, count };
    }
    if (!stats.leastCommonHour || count < stats.leastCommonHour.count) {
      stats.leastCommonHour = { hour, count };
    }
  }

  const groups = groupByDay(coffees);
  const allIntervals: number[] = [];

  for (const [dateKey, group] of groups) {
    // Día con más y menos cafés: cuenta solo cafés (ni tés ni otras bebidas) y
    // solo entre los días en los que hubo al menos un café.
    const coffeeCount = group.filter(isCoffeeType).length;
    if (coffeeCount > 0) {
      if (!stats.maxDay || coffeeCount > stats.maxDay.count) {
        stats.maxDay = { dateKey, count: coffeeCount };
      }
      if (!stats.minDay || coffeeCount < stats.minDay.count) {
        stats.minDay = { dateKey, count: coffeeCount };
      }
    }

    // Primer café más temprano y último café más tarde.
    const first = group[0]!;
    const last = group.at(-1)!;
    if (
      !stats.earliestFirstCoffeeDay ||
      formatTime(first.takenAt) < stats.earliestFirstCoffeeDay.time
    ) {
      stats.earliestFirstCoffeeDay = { dateKey, time: formatTime(first.takenAt) };
    }
    if (!stats.latestLastCoffeeDay || formatTime(last.takenAt) > stats.latestLastCoffeeDay.time) {
      stats.latestLastCoffeeDay = { dateKey, time: formatTime(last.takenAt) };
    }

    // Intervalos del día.
    const dayIntervals: number[] = [];
    for (let i = 1; i < group.length; i++) {
      const minutes = minutesBetween(group[i - 1]!.takenAt, group[i]!.takenAt);
      dayIntervals.push(minutes);
      allIntervals.push(minutes);
      if (!stats.shortestInterval || minutes < stats.shortestInterval.minutes) {
        stats.shortestInterval = { dateKey, minutes };
      }
      if (!stats.longestInterval || minutes > stats.longestInterval.minutes) {
        stats.longestInterval = { dateKey, minutes };
      }
    }

    // Consistencia: requiere al menos 3 cafés (2 intervalos) para tener sentido.
    if (dayIntervals.length >= 2) {
      const deviation = stdDev(dayIntervals);
      if (!stats.mostConsistentDay || deviation < stats.mostConsistentDay.stdDevMinutes) {
        stats.mostConsistentDay = { dateKey, stdDevMinutes: deviation };
      }
      if (!stats.mostIrregularDay || deviation > stats.mostIrregularDay.stdDevMinutes) {
        stats.mostIrregularDay = { dateKey, stdDevMinutes: deviation };
      }
    }
  }

  stats.avgIntervalMinutes = average(allIntervals);
  return stats;
}
