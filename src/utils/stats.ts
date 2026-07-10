/**
 * Motor de estadísticas: funciones puras sobre la lista de cafés
 * (siempre ordenada de forma ascendente por takenAt).
 */
import type { Coffee } from '@/types/coffee';
import type { Profile } from '@/types/profile';
import type {
  DashboardStats,
  DayCount,
  HistoricStats,
  MonthStats,
  TodayStats,
  WeekStats,
} from '@/types/stats';
import {
  addDays,
  isoWeekday,
  minutesBetween,
  parseTimeToMinutes,
  startOfWeek,
  toDateKey,
  toMonthKey,
} from './dates';

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Agrupa los cafés por día local, conservando el orden cronológico. */
export function groupByDay(coffees: Coffee[]): Map<string, Coffee[]> {
  const groups = new Map<string, Coffee[]>();
  for (const coffee of coffees) {
    const key = toDateKey(coffee.takenAt);
    const group = groups.get(key);
    if (group) {
      group.push(coffee);
    } else {
      groups.set(key, [coffee]);
    }
  }
  return groups;
}

/** Recuento por día como lista ordenada. */
export function countByDay(coffees: Coffee[]): DayCount[] {
  return [...groupByDay(coffees)].map(([dateKey, group]) => ({
    dateKey,
    count: group.length,
  }));
}

/**
 * Intervalos en minutos entre cafés consecutivos del mismo día.
 * Los saltos entre días no son intervalos reales de consumo.
 */
export function intraDayIntervals(coffees: Coffee[]): number[] {
  const intervals: number[] = [];
  for (const group of groupByDay(coffees).values()) {
    for (let i = 1; i < group.length; i++) {
      const previous = group[i - 1];
      const current = group[i];
      if (previous && current) {
        intervals.push(minutesBetween(previous.takenAt, current.takenAt));
      }
    }
  }
  return intervals;
}

export function coffeesOfDay(coffees: Coffee[], date: Date): Coffee[] {
  const key = toDateKey(date);
  return coffees.filter((coffee) => toDateKey(coffee.takenAt) === key);
}

/**
 * Minutos desde medianoche del café número `position` (empezando en 1) en cada
 * día del histórico que llegó a esa posición. Captura el patrón de a qué hora
 * sueles tomar el primer, segundo, tercer... café del día.
 */
function nthCoffeeMinutesByDay(coffees: Coffee[], position: number): number[] {
  return [...groupByDay(coffees).values()]
    .map((group) => group[position - 1])
    .filter((coffee): coffee is Coffee => coffee !== undefined)
    .map((coffee) => coffee.takenAt.getHours() * 60 + coffee.takenAt.getMinutes());
}

export function computeDashboardStats(coffees: Coffee[], now: Date): DashboardStats {
  const today = coffeesOfDay(coffees, now);
  const lastCoffee = coffees.at(-1) ?? null;
  const firstToday = today[0];
  const lastToday = today.at(-1);

  const todayIntervals: number[] = [];
  for (let i = 1; i < today.length; i++) {
    const previous = today[i - 1];
    const current = today[i];
    if (previous && current) todayIntervals.push(minutesBetween(previous.takenAt, current.takenAt));
  }
  const todayAvgInterval = average(todayIntervals);
  const historicAvgInterval = average(intraDayIntervals(coffees));

  // Ritmo: cafés por hora desde el primer café del día (mínimo una hora de ventana).
  let coffeesPerHourToday: number | null = null;
  if (firstToday) {
    const hoursElapsed = Math.max(minutesBetween(firstToday.takenAt, now) / 60, 1);
    coffeesPerHourToday = today.length / hoursElapsed;
  }

  // Estimación del siguiente café combinando dos patrones del histórico:
  // 1) A qué hora sueles tomar el café que ocupa la siguiente posición del día
  //    (si hoy llevas 2, la media de la hora de tu 3er café en días con 3 o más).
  // 2) Tu ritmo real de hoy: último café + intervalo medio entre cafés.
  // El peso del patrón por posición crece con los días que lo respaldan; si no
  // hay ningún día que llegara a esa posición, se usa solo el ritmo.
  let nextCoffeeEstimate: Date | null = null;
  const nextPosition = today.length + 1;
  const positionMinutes = nthCoffeeMinutesByDay(coffees, nextPosition);
  const avgPositionMinutes = average(positionMinutes);

  let intervalMinutes: number | null = null;
  if (lastToday) {
    const referenceInterval = historicAvgInterval ?? todayAvgInterval;
    if (referenceInterval !== null) {
      intervalMinutes =
        lastToday.takenAt.getHours() * 60 + lastToday.takenAt.getMinutes() + referenceInterval;
    }
  }

  let estimateMinutes: number | null;
  if (avgPositionMinutes !== null && intervalMinutes !== null) {
    const patternWeight = Math.min(positionMinutes.length / 5, 1) * 0.6;
    estimateMinutes = avgPositionMinutes * patternWeight + intervalMinutes * (1 - patternWeight);
  } else {
    estimateMinutes = avgPositionMinutes ?? intervalMinutes;
  }

  if (estimateMinutes !== null) {
    // Si hoy vas adelantado a tu patrón, la media por posición puede quedar
    // antes del último café: en ese caso manda el ritmo de hoy.
    if (lastToday) {
      const lastMinutes = lastToday.takenAt.getHours() * 60 + lastToday.takenAt.getMinutes();
      if (estimateMinutes <= lastMinutes && intervalMinutes !== null) {
        estimateMinutes = intervalMinutes;
      }
    }
    const estimate = new Date(now);
    estimate.setHours(0, Math.round(estimateMinutes), 0, 0);
    nextCoffeeEstimate = estimate;
  }

  return {
    todayCount: today.length,
    todayCaffeineCount: today.filter((coffee) => coffee.hasCaffeine).length,
    lastCoffee,
    minutesSinceLast: lastCoffee ? minutesBetween(lastCoffee.takenAt, now) : null,
    todayAvgIntervalMinutes: todayAvgInterval,
    historicAvgIntervalMinutes: historicAvgInterval,
    coffeesPerHourToday,
    nextCoffeeEstimate,
  };
}

export function computeTodayStats(coffees: Coffee[], now: Date): TodayStats {
  const dashboard = computeDashboardStats(coffees, now);
  return {
    count: dashboard.todayCount,
    coffeesPerHour: dashboard.coffeesPerHourToday,
    avgIntervalMinutes: dashboard.todayAvgIntervalMinutes,
  };
}

/** Estadísticas de la semana actual (lunes a domingo). */
export function computeWeekStats(coffees: Coffee[], now: Date): WeekStats {
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const weekCoffees = coffees.filter(
    (coffee) => coffee.takenAt >= weekStart && coffee.takenAt < weekEnd,
  );
  const days = countByDay(weekCoffees);
  const elapsedDays = Math.min(isoWeekday(now), 7);

  let maxDay: DayCount | null = null;
  let minDay: DayCount | null = null;
  for (const day of days) {
    if (!maxDay || day.count > maxDay.count) maxDay = day;
    if (!minDay || day.count < minDay.count) minDay = day;
  }

  return {
    total: weekCoffees.length,
    dailyAvg: elapsedDays > 0 ? weekCoffees.length / elapsedDays : 0,
    maxDay,
    minDay,
  };
}

/** Estadísticas del mes actual, con el total del mes anterior para comparar. */
export function computeMonthStats(coffees: Coffee[], now: Date): MonthStats {
  const currentKey = toMonthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = toMonthKey(previousDate);

  let total = 0;
  let previousTotal = 0;
  for (const coffee of coffees) {
    const key = toMonthKey(coffee.takenAt);
    if (key === currentKey) total++;
    else if (key === previousKey) previousTotal++;
  }

  const elapsedDays = now.getDate();
  const elapsedWeeks = Math.max(elapsedDays / 7, 1);

  return {
    total,
    dailyAvg: elapsedDays > 0 ? total / elapsedDays : 0,
    weeklyAvg: total / elapsedWeeks,
    previousTotal,
  };
}

/** Estadísticas de todo el histórico. */
export function computeHistoricStats(coffees: Coffee[], profile: Profile | null): HistoricStats {
  const firstCoffee = coffees[0] ?? null;
  const dayCount = groupByDay(coffees).size;

  const weeks = new Set<string>();
  const months = new Set<string>();
  for (const coffee of coffees) {
    weeks.add(toDateKey(startOfWeek(coffee.takenAt)));
    months.add(toMonthKey(coffee.takenAt));
  }

  // Horas trabajadas: días laborables transcurridos desde el primer café
  // multiplicados por la duración de la jornada configurada.
  let totalWorkedHours: number | null = null;
  if (profile && firstCoffee) {
    const dailyMinutes =
      parseTimeToMinutes(profile.workEnd) - parseTimeToMinutes(profile.workStart);
    if (dailyMinutes > 0 && profile.workDays.length > 0) {
      let workedDays = 0;
      const today = new Date();
      for (let day = new Date(firstCoffee.takenAt); day <= today; day = addDays(day, 1)) {
        if (profile.workDays.includes(isoWeekday(day))) workedDays++;
      }
      totalWorkedHours = (workedDays * dailyMinutes) / 60;
    }
  }

  const intervals = intraDayIntervals(coffees);

  return {
    total: coffees.length,
    dailyAvg: dayCount > 0 ? coffees.length / dayCount : 0,
    weeklyAvg: weeks.size > 0 ? coffees.length / weeks.size : 0,
    monthlyAvg: months.size > 0 ? coffees.length / months.size : 0,
    totalWorkedHours,
    totalIntervalMinutes: intervals.reduce((sum, value) => sum + value, 0),
    firstCoffee,
  };
}
