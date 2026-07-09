import type { Coffee } from './coffee';

/** Recuento de cafés de un día concreto. */
export interface DayCount {
  dateKey: string;
  count: number;
}

/** Datos en vivo del panel principal. */
export interface DashboardStats {
  todayCount: number;
  /** Cafés de hoy que tenían cafeína. */
  todayCaffeineCount: number;
  lastCoffee: Coffee | null;
  /** Minutos desde el último café (de cualquier día). */
  minutesSinceLast: number | null;
  /** Tiempo medio entre cafés de hoy, en minutos. */
  todayAvgIntervalMinutes: number | null;
  /** Tiempo medio histórico entre cafés del mismo día, en minutos. */
  historicAvgIntervalMinutes: number | null;
  /** Ritmo de consumo de hoy: cafés por hora desde el primer café. */
  coffeesPerHourToday: number | null;
  /** Hora estimada del siguiente café según el histórico. */
  nextCoffeeEstimate: Date | null;
}

export interface TodayStats {
  count: number;
  coffeesPerHour: number | null;
  avgIntervalMinutes: number | null;
}

export interface WeekStats {
  total: number;
  dailyAvg: number;
  /** Día de la semana con más cafés. */
  maxDay: DayCount | null;
  /** Día de la semana con menos cafés (entre los días con registros). */
  minDay: DayCount | null;
}

export interface MonthStats {
  total: number;
  dailyAvg: number;
  weeklyAvg: number;
  /** Total del mes anterior, para la comparación. */
  previousTotal: number;
}

export interface HistoricStats {
  total: number;
  /** Media por día con registros. */
  dailyAvg: number;
  weeklyAvg: number;
  monthlyAvg: number;
  /** Horas de trabajo acumuladas según la configuración del perfil. */
  totalWorkedHours: number | null;
  /** Suma de todos los intervalos entre cafés del mismo día, en minutos. */
  totalIntervalMinutes: number;
  firstCoffee: Coffee | null;
}
