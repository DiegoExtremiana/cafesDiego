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

/**
 * Miligramos de cafeína de cada bebida: la unidad base de toda la aplicación.
 * Edita aquí para ajustar valores o al añadir bebidas nuevas; estadísticas,
 * gráficos y objetivos se recalculan solos a partir de esta tabla.
 */
export const COFFEE_TYPE_CAFFEINE_MG: Record<CoffeeType, number> = {
  espresso: 63,
  americano: 63,
  cortado: 63,
  capuchino: 63,
  latte: 63,
  otro: 63,
  energetica: 80,
  te_negro: 47,
  te_verde: 28,
  matcha: 64,
  cola: 34,
  zumo: 0,
  leche: 0,
  infusion: 0,
};

/** Cafeína de un espresso: referencia de la equivalencia visual "≈ N espressos". */
export const ESPRESSO_MG = COFFEE_TYPE_CAFFEINE_MG.espresso;

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

/**
 * Cafeína aportada por una consumición, en mg. Las bebidas marcadas como
 * descafeinadas aportan 0 aunque su tipo tenga cafeína (espresso descafeinado).
 */
export function caffeineMg(coffee: Pick<Coffee, 'type' | 'hasCaffeine'>): number {
  return coffee.hasCaffeine ? (COFFEE_TYPE_CAFFEINE_MG[coffee.type] ?? ESPRESSO_MG) : 0;
}

/** Suma de cafeína en mg de una lista de consumiciones. */
export function sumCaffeineMg(coffees: Pick<Coffee, 'type' | 'hasCaffeine'>[]): number {
  return coffees.reduce((sum, coffee) => sum + caffeineMg(coffee), 0);
}

/** Equivalencia visual: cuántos espressos representan estos miligramos. */
export function espressoEquivalent(mg: number): number {
  return mg / ESPRESSO_MG;
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
