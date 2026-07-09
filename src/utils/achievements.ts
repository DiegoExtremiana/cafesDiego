/** Sistema de logros calculado en el cliente a partir del histórico. */
import type { Coffee } from '@/types/coffee';
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
  | 'rocket';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  achieved: boolean;
  /** Progreso hacia el objetivo (para logros no conseguidos). */
  progress: { current: number; target: number };
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  target: number;
  metric: 'coffees' | 'days' | 'earlyCoffee' | 'bigDay';
}

const DEFINITIONS: AchievementDef[] = [
  {
    id: 'first-coffee',
    title: 'Primera taza',
    description: 'Registra tu primer café.',
    icon: 'coffee',
    target: 1,
    metric: 'coffees',
  },
  {
    id: 'coffees-100',
    title: 'Centenario',
    description: 'Alcanza los 100 cafés registrados.',
    icon: 'medal',
    target: 100,
    metric: 'coffees',
  },
  {
    id: 'coffees-250',
    title: 'Cuarto de millar',
    description: 'Alcanza los 250 cafés registrados.',
    icon: 'trophy',
    target: 250,
    metric: 'coffees',
  },
  {
    id: 'coffees-500',
    title: 'Medio millar',
    description: 'Alcanza los 500 cafés registrados.',
    icon: 'crown',
    target: 500,
    metric: 'coffees',
  },
  {
    id: 'coffees-1000',
    title: 'Leyenda del café',
    description: 'Alcanza los 1000 cafés registrados.',
    icon: 'gem',
    target: 1000,
    metric: 'coffees',
  },
  {
    id: 'days-30',
    title: 'Un mes de ritual',
    description: 'Registra cafés en 30 días distintos.',
    icon: 'calendar',
    target: 30,
    metric: 'days',
  },
  {
    id: 'days-100',
    title: 'Cien amaneceres',
    description: 'Registra cafés en 100 días distintos.',
    icon: 'flame',
    target: 100,
    metric: 'days',
  },
  {
    id: 'days-365',
    title: 'Un año entero',
    description: 'Registra cafés en 365 días distintos.',
    icon: 'star',
    target: 365,
    metric: 'days',
  },
  {
    id: 'early-bird',
    title: 'Madrugador',
    description: 'Toma un café antes de las 07:00.',
    icon: 'sunrise',
    target: 1,
    metric: 'earlyCoffee',
  },
  {
    id: 'big-day',
    title: 'Día intenso',
    description: 'Registra 5 o más cafés en un mismo día.',
    icon: 'rocket',
    target: 5,
    metric: 'bigDay',
  },
];

export function computeAchievements(coffees: Coffee[]): Achievement[] {
  const totalCoffees = coffees.length;
  const groups = groupByDay(coffees);
  const totalDays = groups.size;
  const earlyCoffees = coffees.filter((coffee) => coffee.takenAt.getHours() < 7).length;
  let maxPerDay = 0;
  for (const group of groups.values()) {
    if (group.length > maxPerDay) maxPerDay = group.length;
  }

  return DEFINITIONS.map((def) => {
    const current =
      def.metric === 'coffees'
        ? totalCoffees
        : def.metric === 'days'
          ? totalDays
          : def.metric === 'earlyCoffee'
            ? earlyCoffees
            : maxPerDay;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      achieved: current >= def.target,
      progress: { current: Math.min(current, def.target), target: def.target },
    };
  });
}
