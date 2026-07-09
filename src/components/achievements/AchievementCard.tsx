import {
  CalendarCheck,
  Coffee,
  Crown,
  Flame,
  Gem,
  Medal,
  Rocket,
  Star,
  Sunrise,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatInteger } from '@/utils/format';
import type { Achievement, AchievementIcon } from '@/utils/achievements';

const icons: Record<AchievementIcon, LucideIcon> = {
  coffee: Coffee,
  medal: Medal,
  trophy: Trophy,
  crown: Crown,
  gem: Gem,
  calendar: CalendarCheck,
  flame: Flame,
  star: Star,
  sunrise: Sunrise,
  rocket: Rocket,
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = icons[achievement.icon];
  const { current, target } = achievement.progress;
  const percent = Math.round((current / target) * 100);

  return (
    <Card
      className={`flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5 ${
        achievement.achieved ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            achievement.achieved
              ? 'bg-coffee-600 text-white shadow-sm'
              : 'bg-coffee-100 text-coffee-300'
          }`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-coffee-900">{achievement.title}</h3>
          <p className="text-xs text-coffee-400">{achievement.description}</p>
        </div>
      </div>
      {achievement.achieved ? (
        <p className="text-xs font-medium text-emerald-600">Conseguido</p>
      ) : (
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-coffee-400">
            <span>
              {formatInteger(current)} / {formatInteger(target)}
            </span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-coffee-100">
            <div
              className="h-full rounded-full bg-coffee-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
