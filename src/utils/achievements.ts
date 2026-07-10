/** Sistema de logros calculado en el cliente a partir del histórico. */
import { caffeineMg, type Coffee, type CoffeeType } from '@/types/coffee';
import { groupByDay } from './stats';

export type AchievementIcon =
  | 'coffee'
  | 'medal'
  | 'trophy'
  | 'crown'
  | 'gem'
  | 'calendar'
  | 'flame'
  | 'star'
  | 'sunrise'
  | 'rocket'
  | 'zap'
  | 'zapoff'
  | 'leaf'
  | 'moon'
  | 'shield';

/** Sección a la que pertenece el logro en la página de logros. */
export type AchievementCategory = 'cafetero' | 'zero';

export const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string }[] = [
  { key: 'cafetero', label: 'Cafetero' },
  { key: 'zero', label: '0 cafeína' },
];

export interface Achievement {
  id: string;
  /** Nombre base del logro (no cambia entre niveles). */
  title: string;
  /** Descripción del objetivo del nivel actual (o del último si está al máximo). */
  description: string;
  icon: AchievementIcon;
  category: AchievementCategory;
  /** Niveles completados. */
  level: number;
  /** Número total de niveles del logro. */
  maxLevel: number;
  /** true cuando se han completado todos los niveles. */
  maxed: boolean;
  /** true en cuanto se completa el primer nivel: cada nivel completado cuenta como conseguido. */
  achieved: boolean;
  /** Progreso hacia el siguiente nivel (lleno cuando está al máximo). */
  progress: { current: number; target: number };
}

/** Métricas disponibles; cada una ya cuenta solo lo que le corresponde. */
type Metric =
  | 'coffees'
  | 'coffeeDays'
  | 'maxCoffeesDay'
  | 'earlyCoffees'
  | 'energyCombo'
  | 'decafDrinks'
  | 'zeroDays';

interface AchievementDef {
  id: string;
  title: string;
  icon: AchievementIcon;
  category: AchievementCategory;
  metric: Metric;
  /** Umbrales crecientes; el logro va pasando de uno al siguiente. */
  tiers: number[];
  /** Plantilla de descripción; {n} se sustituye por el objetivo del nivel. */
  template: string;
}

/** Tipos que cuentan como "café" (grupo Café del selector). */
const COFFEE_TYPES: ReadonlySet<CoffeeType> = new Set<CoffeeType>([
  'espresso',
  'americano',
  'cortado',
  'capuchino',
  'latte',
  'otro',
]);

function isCoffee(coffee: Coffee): boolean {
  return COFFEE_TYPES.has(coffee.type);
}

const DEFINITIONS: AchievementDef[] = [
  {
    id: 'coffees',
    title: 'Cafetero',
    icon: 'coffee',
    category: 'cafetero',
    metric: 'coffees',
    tiers: [1, 10, 50, 100, 250, 500, 1000],
    template: 'Bebe {n} cafés.',
  },
  {
    id: 'coffee-days',
    title: 'Constancia',
    icon: 'calendar',
    category: 'cafetero',
    metric: 'coffeeDays',
    tiers: [1, 30, 100, 365],
    template: 'Registra café en {n} días distintos.',
  },
  {
    id: 'big-day',
    title: 'Día intenso',
    icon: 'rocket',
    category: 'cafetero',
    metric: 'maxCoffeesDay',
    tiers: [3, 5, 8, 12],
    template: 'Toma {n} cafés en un mismo día.',
  },
  {
    id: 'early-bird',
    title: 'Madrugador',
    icon: 'sunrise',
    category: 'cafetero',
    metric: 'earlyCoffees',
    tiers: [1, 10, 50],
    template: 'Toma {n} cafés antes de las 07:00.',
  },
  {
    id: 'energy-combo',
    title: 'Veo el sonido',
    icon: 'zap',
    category: 'cafetero',
    metric: 'energyCombo',
    tiers: [1, 5, 20],
    template: 'Toma una energética y un café el mismo día ({n} veces).',
  },
  {
    id: 'decaf',
    title: 'Sin cafeína',
    icon: 'zapoff',
    category: 'zero',
    metric: 'decafDrinks',
    tiers: [1, 10, 50, 100],
    template: 'Registra {n} bebidas sin cafeína.',
  },
  {
    id: 'zero-days',
    title: 'Días en calma',
    icon: 'leaf',
    category: 'zero',
    metric: 'zeroDays',
    tiers: [1, 7, 30, 100],
    template: 'Suma {n} días con registros y cero cafeína.',
  },
];

/** Resuelve un logro escalonado al nivel correspondiente al valor actual. */
function resolve(def: AchievementDef, current: number): Achievement {
  const maxLevel = def.tiers.length;
  let level = 0;
  while (level < maxLevel && current >= (def.tiers[level] ?? Infinity)) level++;
  const maxed = level >= maxLevel;
  // Objetivo mostrado: el siguiente umbral por alcanzar, o el último si está al máximo.
  const target = maxed ? (def.tiers[maxLevel - 1] ?? 0) : (def.tiers[level] ?? 0);
  return {
    id: def.id,
    title: def.title,
    description: def.template.replace('{n}', String(target)),
    icon: def.icon,
    category: def.category,
    level,
    maxLevel,
    maxed,
    achieved: level >= 1,
    progress: { current: Math.min(current, target), target },
  };
}

export function computeAchievements(coffees: Coffee[]): Achievement[] {
  const onlyCoffees = coffees.filter(isCoffee);
  const totalCoffees = onlyCoffees.length;
  const earlyCoffees = onlyCoffees.filter((coffee) => coffee.takenAt.getHours() < 7).length;
  const decafDrinks = coffees.filter((coffee) => caffeineMg(coffee) === 0).length;

  const groups = groupByDay(coffees);
  let coffeeDays = 0;
  let maxCoffeesDay = 0;
  let energyCombo = 0;
  let zeroDays = 0;
  for (const group of groups.values()) {
    const dayCoffees = group.filter(isCoffee).length;
    if (dayCoffees > 0) coffeeDays++;
    if (dayCoffees > maxCoffeesDay) maxCoffeesDay = dayCoffees;
    const hasEnergy = group.some((coffee) => coffee.type === 'energetica');
    if (hasEnergy && dayCoffees > 0) energyCombo++;
    if (group.every((coffee) => caffeineMg(coffee) === 0)) zeroDays++;
  }

  const metrics: Record<Metric, number> = {
    coffees: totalCoffees,
    coffeeDays,
    maxCoffeesDay,
    earlyCoffees,
    energyCombo,
    decafDrinks,
    zeroDays,
  };

  return DEFINITIONS.map((def) => resolve(def, metrics[def.metric]));
}
