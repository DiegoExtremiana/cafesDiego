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

/** Miligramos de cafeína legibles: "241 mg". */
export function formatMg(mg: number): string {
  return `${integerFormat.format(Math.round(mg))} mg`;
}

/** Equivalencia visual en espressos: "≈ 3,8 espressos". */
export function formatEspressos(espressos: number): string {
  const rounded = Math.round(espressos * 10) / 10;
  return `≈ ${decimalFormat.format(rounded)} ${rounded === 1 ? 'espresso' : 'espressos'}`;
}

/** Pluraliza "café". */
export function coffeeLabel(count: number): string {
  return count === 1 ? 'café' : 'cafés';
}

/** Pluraliza "bebida". */
export function drinkLabel(count: number): string {
  return count === 1 ? 'bebida' : 'bebidas';
}
