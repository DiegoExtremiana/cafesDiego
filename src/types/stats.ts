import type { Coffee } from './coffee';

/** Cafeína consumida un día concreto, en mg. */
export interface DayCount {
  dateKey: string;
  /** Miligramos de cafeína del día. */
  count: number;
}

/** Datos en vivo del panel principal. La unidad base es el mg de cafeína. */
export interface DashboardStats {
  /** Cafeína consumida hoy, en mg. */
  todayMg: number;
  /** Consumiciones registradas hoy (unidades, para el límite de bebidas). */
  todayDrinks: number;
  lastCoffee: Coffee | null;
  /** Minutos desde la última bebida (de cualquier día). */
  minutesSinceLast: number | null;
  /** Tiempo medio entre bebidas de hoy, en minutos. */
  todayAvgIntervalMinutes: number | null;
  /** Tiempo medio histórico entre bebidas del mismo día, en minutos. */
  historicAvgIntervalMinutes: number | null;
  /** Ritmo de hoy: mg de cafeína por hora desde la primera bebida. */
  mgPerHourToday: number | null;
  /** Hora estimada de la siguiente bebida según el histórico. */
  nextCoffeeEstimate: Date | null;
}

export interface TodayStats {
  /** Cafeína de hoy en mg. */
  mg: number;
  /** Consumiciones de hoy (unidades). */
  drinks: number;
  mgPerHour: number | null;
  avgIntervalMinutes: number | null;
}

export interface WeekStats {
  /** Cafeína total de la semana, en mg. */
  total: number;
  /** Media diaria de cafeína, en mg. */
  dailyAvg: number;
  /** Día de la semana con más cafeína. */
  maxDay: DayCount | null;
  /** Día de la semana con menos cafeína (entre los días con registros). */
  minDay: DayCount | null;
}

export interface MonthStats {
  /** Cafeína total del mes, en mg. */
  total: number;
  dailyAvg: number;
  weeklyAvg: number;
  /** Total del mes anterior en mg, para la comparación. */
  previousTotal: number;
}

export interface HistoricStats {
  /** Cafeína total del histórico, en mg. */
  total: number;
  /** Consumiciones totales registradas (unidades). */
  totalDrinks: number;
  /** Media de mg por día con registros. */
  dailyAvg: number;
  weeklyAvg: number;
  monthlyAvg: number;
  /** Horas de trabajo acumuladas según la configuración del perfil. */
  totalWorkedHours: number | null;
  /** Suma de todos los intervalos entre bebidas del mismo día, en minutos. */
  totalIntervalMinutes: number;
  firstCoffee: Coffee | null;
}
