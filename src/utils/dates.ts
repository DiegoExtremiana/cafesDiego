/**
 * Utilidades de fechas. Todas trabajan en la zona horaria local del
 * usuario, que es la relevante para una jornada laboral.
 */

export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;

const dateKeyFormat = new Intl.DateTimeFormat('sv-SE'); // YYYY-MM-DD
const timeFormat = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const shortDateFormat = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const longDateFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const monthNameFormat = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric',
});
const weekdayNameFormat = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });

/** Clave de día local: YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  return dateKeyFormat.format(date);
}

/** Convierte una clave YYYY-MM-DD en un Date a medianoche local. */
export function dateKeyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Clave de mes local: YYYY-MM. */
export function toMonthKey(date: Date): string {
  return toDateKey(date).slice(0, 7);
}

/** HH:MM en formato 24 horas. */
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** dd/mm/aaaa. */
export function formatDate(date: Date): string {
  return shortDateFormat.format(date);
}

/** "miércoles, 8 de julio de 2026". */
export function formatDateLong(date: Date): string {
  return longDateFormat.format(date);
}

/** "julio de 2026" a partir de una clave YYYY-MM. */
export function formatMonthName(monthKey: string): string {
  return monthNameFormat.format(dateKeyToDate(`${monthKey}-01`));
}

/** Nombre del día de la semana de una clave YYYY-MM-DD. */
export function formatWeekdayName(dateKey: string): string {
  return weekdayNameFormat.format(dateKeyToDate(dateKey));
}

/** Duración legible: 45 min, 2 h 15 min, 3 d 4 h. */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 1) return 'menos de 1 min';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours < 24) return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days} d ${restHours} h` : `${days} d`;
}

export function minutesBetween(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / MINUTE_MS;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Día ISO de la semana: 1 = lunes ... 7 = domingo. */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/** Lunes de la semana de la fecha dada, a medianoche local. */
export function startOfWeek(date: Date): Date {
  return startOfDay(addDays(date, 1 - isoWeekday(date)));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** "07:30" -> 450 minutos desde medianoche. */
export function parseTimeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 450 -> "07:30". */
export function minutesToTimeLabel(minutesFromMidnight: number): string {
  const clamped = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Valor para <input type="date">: YYYY-MM-DD local. */
export function dateInputValue(date: Date): string {
  return toDateKey(date);
}

/** Valor para <input type="time">: HH:MM local. */
export function timeInputValue(date: Date): string {
  return formatTime(date);
}

/** Combina "2026-07-08" y "09:42" en un Date local. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const base = dateKeyToDate(dateStr);
  const minutes = parseTimeToMinutes(timeStr);
  base.setMinutes(minutes);
  return base;
}

/** Etiqueta de hora del día: 8 -> "08:00". */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}
