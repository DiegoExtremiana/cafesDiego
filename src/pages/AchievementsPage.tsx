import { useMemo, useState } from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { useCoffees } from '@/hooks/useCoffees';
import {
  ACHIEVEMENT_CATEGORIES,
  computeAchievements,
  type AchievementCategory,
} from '@/utils/achievements';

export default function AchievementsPage() {
  const { coffees, loading } = useCoffees();
  const achievements = useMemo(() => computeAchievements(coffees), [coffees]);
  const achievedCount = achievements.filter((achievement) => achievement.achieved).length;
  const [collapsed, setCollapsed] = useState<Record<AchievementCategory, boolean>>({
    cafetero: false,
    zero: false,
  });

  if (loading) return <Spinner label="Cargando logros..." />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-coffee-900">Logros</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coffee-100 px-3 py-1 text-sm font-medium text-coffee-700">
          <Trophy className="size-4 text-amber-500" aria-hidden />
          {achievedCount} de {achievements.length}
        </span>
      </div>

      {ACHIEVEMENT_CATEGORIES.map(({ key, label }) => {
        const group = achievements.filter((achievement) => achievement.category === key);
        if (group.length === 0) return null;
        const groupAchieved = group.filter((achievement) => achievement.achieved).length;
        const isOpen = !collapsed[key];
        return (
          <section key={key}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setCollapsed((current) => ({ ...current, [key]: isOpen }))}
              className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left transition-colors hover:bg-coffee-50"
            >
              <ChevronDown
                className={`size-4 text-coffee-400 transition-transform duration-200 ${
                  isOpen ? '' : '-rotate-90'
                }`}
                aria-hidden
              />
              <h2 className="text-base font-semibold text-coffee-900">{label}</h2>
              <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-medium text-coffee-500">
                {groupAchieved}/{group.length}
              </span>
              <span className="h-px flex-1 bg-coffee-100" />
            </button>
            {isOpen && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
