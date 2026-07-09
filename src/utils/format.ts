const decimalFormat = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const integerFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

/** Número con una cifra decimal como máximo, en formato español. */
export function formatNumber(value: number): string {
  return decimalFormat.format(value);
}

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

/** Pluraliza "café". */
export function coffeeLabel(count: number): string {
  return count === 1 ? 'café' : 'cafés';
}
