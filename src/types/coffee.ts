export const COFFEE_TYPES = ['espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro'] as const;

export type CoffeeType = (typeof COFFEE_TYPES)[number];

export const COFFEE_TYPE_LABELS: Record<CoffeeType, string> = {
  espresso: 'Espresso',
  americano: 'Americano',
  cortado: 'Cortado',
  capuchino: 'Capuchino',
  latte: 'Latte',
  otro: 'Otro',
};

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
