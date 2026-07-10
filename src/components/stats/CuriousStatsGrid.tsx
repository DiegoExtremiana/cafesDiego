import {
  AlarmClock,
  Clock3,
  Flame,
  Heart,
  Hourglass,
  Leaf,
  Moon,
  MoonStar,
  Ruler,
  Shuffle,
  Sunrise,
  Turtle,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { dateKeyToDate, formatDate, formatDuration, hourLabel } from '@/utils/dates';
import { coffeeLabel, drinkLabel } from '@/utils/format';
import type { CuriousStats } from '@/utils/curiousStats';

function dayLabel(dateKey: string): string {
  return formatDate(dateKeyToDate(dateKey));
}

/** Rejilla de estadísticas curiosas del histórico. */
export function CuriousStatsGrid({ stats }: { stats: CuriousStats }) {
  const iconClass = 'size-5';
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {stats.earliestCoffee && (
        <StatCard
          icon={<Sunrise className={iconClass} aria-hidden />}
          label="Bebida más temprana"
          value={stats.earliestCoffee.time}
          sub={`Cualquier bebida · ${dayLabel(stats.earliestCoffee.dateKey)}`}
        />
      )}
      {stats.latestCoffee && (
        <StatCard
          icon={<Moon className={iconClass} aria-hidden />}
          label="Bebida más tarde"
          value={stats.latestCoffee.time}
          sub={`Cualquier bebida · ${dayLabel(stats.latestCoffee.dateKey)}`}
        />
      )}
      {stats.maxDay && (
        <StatCard
          icon={<Flame className={iconClass} aria-hidden />}
          label="Día con más cafés"
          value={`${stats.maxDay.count} ${coffeeLabel(stats.maxDay.count)}`}
          sub={`Solo cafés · ${dayLabel(stats.maxDay.dateKey)}`}
          tone="negative"
        />
      )}
      {stats.minDay && (
        <StatCard
          icon={<Leaf className={iconClass} aria-hidden />}
          label="Día con menos cafés"
          value={`${stats.minDay.count} ${coffeeLabel(stats.minDay.count)}`}
          sub={`Solo cafés · ${dayLabel(stats.minDay.dateKey)}`}
          tone="positive"
        />
      )}
      {stats.favoriteHour && (
        <StatCard
          icon={<Heart className={iconClass} aria-hidden />}
          label="Hora favorita"
          value={hourLabel(stats.favoriteHour.hour)}
          sub={`${stats.favoriteHour.count} ${drinkLabel(stats.favoriteHour.count)} en total`}
        />
      )}
      {stats.leastCommonHour && (
        <StatCard
          icon={<Clock3 className={iconClass} aria-hidden />}
          label="Hora menos habitual"
          value={hourLabel(stats.leastCommonHour.hour)}
          sub={`${stats.leastCommonHour.count} ${drinkLabel(stats.leastCommonHour.count)} en total`}
        />
      )}
      {stats.avgIntervalMinutes !== null && (
        <StatCard
          icon={<Hourglass className={iconClass} aria-hidden />}
          label="Intervalo medio"
          value={formatDuration(stats.avgIntervalMinutes)}
          sub="Entre bebidas del mismo día"
        />
      )}
      {stats.shortestInterval && (
        <StatCard
          icon={<Zap className={iconClass} aria-hidden />}
          label="Intervalo más corto"
          value={formatDuration(stats.shortestInterval.minutes)}
          sub={`Entre bebidas · ${dayLabel(stats.shortestInterval.dateKey)}`}
        />
      )}
      {stats.longestInterval && (
        <StatCard
          icon={<Turtle className={iconClass} aria-hidden />}
          label="Intervalo más largo"
          value={formatDuration(stats.longestInterval.minutes)}
          sub={`Entre bebidas · ${dayLabel(stats.longestInterval.dateKey)}`}
        />
      )}
      {stats.mostConsistentDay && (
        <StatCard
          icon={<Ruler className={iconClass} aria-hidden />}
          label="Día más constante"
          value={dayLabel(stats.mostConsistentDay.dateKey)}
          sub={`Desviación de ${formatDuration(stats.mostConsistentDay.stdDevMinutes)}`}
        />
      )}
      {stats.mostIrregularDay && (
        <StatCard
          icon={<Shuffle className={iconClass} aria-hidden />}
          label="Día más irregular"
          value={dayLabel(stats.mostIrregularDay.dateKey)}
          sub={`Desviación de ${formatDuration(stats.mostIrregularDay.stdDevMinutes)}`}
        />
      )}
      {stats.earliestFirstCoffeeDay && (
        <StatCard
          icon={<AlarmClock className={iconClass} aria-hidden />}
          label="Primera bebida más temprana"
          value={stats.earliestFirstCoffeeDay.time}
          sub={`La primera del día · ${dayLabel(stats.earliestFirstCoffeeDay.dateKey)}`}
        />
      )}
      {stats.latestLastCoffeeDay && (
        <StatCard
          icon={<MoonStar className={iconClass} aria-hidden />}
          label="Última bebida más tarde"
          value={stats.latestLastCoffeeDay.time}
          sub={`La última del día · ${dayLabel(stats.latestLastCoffeeDay.dateKey)}`}
        />
      )}
    </div>
  );
}
