import {
  CalendarCheck,
  Coffee,
  Crown,
  Flame,
  Gem,
  Leaf,
  Medal,
  Moon,
  Rocket,
  Shield,
  Star,
  Sunrise,
  Trophy,
  Zap,
  ZapOff,
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
  zap: Zap,
  zapoff: ZapOff,
  leaf: Leaf,
  moon: Moon,
  shield: Shield,
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = icons[achievement.icon];
  const { current, target } = achievement.progress;
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;
  const { achieved, maxed, level, maxLevel } = achievement;

  return (
    <Card
      className={`flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5 ${
        achieved ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            achieved ? 'bg-coffee-600 text-white shadow-sm' : 'bg-coffee-100 text-coffee-300'
          }`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-coffee-900">{achievement.title}</h3>
            {level > 0 && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  maxed ? 'bg-amber-100 text-amber-700' : 'bg-coffee-100 text-coffee-600'
                }`}
              >
                {maxed ? 'MÁX' : `Nv. ${level}`}
              </span>
            )}
          </div>
          <p className="text-xs text-coffee-400">{achievement.description}</p>
        </div>
      </div>
      {maxed ? (
        <p className="text-xs font-medium text-amber-600">
          ¡Nivel máximo! ({maxLevel} de {maxLevel})
        </p>
      ) : (
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className={achieved ? 'font-medium text-emerald-600' : 'text-coffee-400'}>
              {achieved ? `Nivel ${level} conseguido` : 'Sin empezar'}
            </span>
            <span className="text-coffee-400">
              {formatInteger(current)} / {formatInteger(target)}
            </span>
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
