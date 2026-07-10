export const COFFEE_TYPES = [
  'espresso',
  'americano',
  'cortado',
  'capuchino',
  'latte',
  'otro',
  'energetica',
  'te_negro',
  'te_verde',
  'matcha',
  'cola',
  'zumo',
  'leche',
  'infusion',
] as const;

export type CoffeeType = (typeof COFFEE_TYPES)[number];

export const COFFEE_TYPE_LABELS: Record<CoffeeType, string> = {
  espresso: 'Espresso',
  americano: 'Americano',
  cortado: 'Cortado',
  capuchino: 'Capuchino',
  latte: 'Latte',
  otro: 'Otro',
  energetica: 'Energética',
  te_negro: 'Té negro',
  te_verde: 'Té verde',
  matcha: 'Matcha',
  cola: 'Cola',
  zumo: 'Zumo',
  leche: 'Leche',
  infusion: 'Infusión',
};

/** Cuántos cafés "vale" cada tipo en contadores, estadísticas y gráficos. */
export const COFFEE_TYPE_VALUES: Record<CoffeeType, number> = {
  espresso: 1,
  americano: 1,
  cortado: 1,
  capuchino: 1,
  latte: 1,
  otro: 1,
  energetica: 1.5,
  te_negro: 0.5,
  te_verde: 0.3,
  matcha: 0.8,
  cola: 0.3,
  zumo: 0,
  leche: 0,
  infusion: 0,
};

/**
 * Tipos restringidos a un estado del interruptor de cafeína: las bebidas con
 * cafeína (energética, tés, cola) solo aparecen con él activado y las demás
 * (zumo, leche, infusión) solo sin él. Los cafés valen en ambos estados.
 */
const CAFFEINE_RESTRICTED_TYPES: Partial<Record<CoffeeType, boolean>> = {
  energetica: true,
  te_negro: true,
  te_verde: true,
  matcha: true,
  cola: true,
  zumo: false,
  leche: false,
  infusion: false,
};

/** Tipos seleccionables para un estado del interruptor de cafeína. */
export function coffeeTypesFor(hasCaffeine: boolean): CoffeeType[] {
  return COFFEE_TYPES.filter((type) => {
    const restriction = CAFFEINE_RESTRICTED_TYPES[type];
    return restriction === undefined || restriction === hasCaffeine;
  });
}

/** Valor en cafés de una consumición. */
export function coffeeValue(coffee: Pick<Coffee, 'type'>): number {
  return COFFEE_TYPE_VALUES[coffee.type] ?? 1;
}

/** Suma del valor en cafés de una lista de consumiciones. */
export function sumCoffeeValue(coffees: Pick<Coffee, 'type'>[]): number {
  return coffees.reduce((sum, coffee) => sum + coffeeValue(coffee), 0);
}

/** Tipo de café y si tenía cafeína, elegidos al mantener pulsado el botón de registro. */
export interface CoffeeDetails {
  type: CoffeeType;
  hasCaffeine: boolean;
}

/** Un café registrado. taken_at es la única fuente de verdad temporal. */
export interface Coffee extends CoffeeDetails {
  id: string;
  userId: string;
  takenAt: Date;
}
