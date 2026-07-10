import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { useCoffees } from '@/hooks/useCoffees';
import { computeAchievements } from '@/utils/achievements';

export default function AchievementsPage() {
  const { coffees, loading } = useCoffees();
  const achievements = useMemo(() => computeAchievements(coffees), [coffees]);
  const achievedCount = achievements.filter((achievement) => achievement.achieved).length;

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
