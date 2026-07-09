/** Exportación de datos a CSV y JSON (descarga en el navegador). */
import type { Coffee } from '@/types/coffee';
import { formatTime, toDateKey } from './dates';

function download(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function timestamp(): string {
  return toDateKey(new Date());
}

/** CSV con separador ';' y BOM para abrirse bien en Excel en español. */
export function exportToCsv(coffees: Coffee[]): void {
  const header = 'fecha;hora;timestamp_iso';
  const rows = coffees.map(
    (coffee) =>
      `${toDateKey(coffee.takenAt)};${formatTime(coffee.takenAt)};${coffee.takenAt.toISOString()}`,
  );
  const content = `﻿${[header, ...rows].join('\r\n')}`;
  download(content, `cafes-${timestamp()}.csv`, 'text/csv;charset=utf-8');
}

export function exportToJson(coffees: Coffee[]): void {
  const data = coffees.map((coffee) => ({
    fecha: toDateKey(coffee.takenAt),
    hora: formatTime(coffee.takenAt),
    timestamp: coffee.takenAt.toISOString(),
  }));
  download(JSON.stringify(data, null, 2), `cafes-${timestamp()}.json`, 'application/json');
}
