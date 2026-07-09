import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Clock,
  Coffee as CoffeeIcon,
  Eye,
  History,
  LineChart,
  Trophy,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Brand } from '@/components/layout/Brand';
import { StatCard } from '@/components/dashboard/StatCard';
import { CuriousStatsGrid } from '@/components/stats/CuriousStatsGrid';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { SeriesChart } from '@/components/charts/SeriesChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { chartColors } from '@/components/charts/theme';
import { getPublicProfile } from '@/services/profileService';
import { listCoffees } from '@/services/coffeeService';
import { computeHistoricStats } from '@/utils/stats';
import { computeCuriousStats } from '@/utils/curiousStats';
import { computeAchievements } from '@/utils/achievements';
import { dailySeries, hourlyDistribution, monthlySeries } from '@/utils/chartData';
import { formatDate, formatDuration, formatTime } from '@/utils/dates';
import { coffeeLabel, formatInteger, formatNumber } from '@/utils/format';
import type { Profile } from '@/types/profile';
import type { Coffee } from '@/types/coffee';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [state, setState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!username) {
      setState('not-found');
      return;
    }
    let cancelled = false;
    setState('loading');
    getPublicProfile(username)
      .then(async (loaded) => {
        if (!loaded) {
          if (!cancelled) setState('not-found');
          return;
        }
        const loadedCoffees = await listCoffees(loaded.id);
        if (!cancelled) {
          setProfile(loaded);
          setCoffees(loadedCoffees);
          setState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const historic = useMemo(
    () => computeHistoricStats(coffees, profile),
    [coffees, profile],
  );
  const curious = useMemo(() => computeCuriousStats(coffees), [coffees]);
  const achievements = useMemo(() => computeAchievements(coffees), [coffees]);
  const daily = useMemo(() => dailySeries(coffees, now), [coffees, now]);
  const monthly = useMemo(() => monthlySeries(coffees, now), [coffees, now]);
  const hourly = useMemo(() => hourlyDistribution(coffees), [coffees]);
  const recentCoffees = useMemo(() => coffees.slice(-10).reverse(), [coffees]);

  if (state === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-50">
        <Spinner label="Cargando perfil..." />
      </main>
    );
  }

  if (state === 'not-found' || state === 'error' || !profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream-50 p-4">
        <Brand size="lg" />
        <EmptyState
          icon={<CoffeeIcon className="size-10" aria-hidden />}
          title={state === 'error' ? 'No se pudo cargar el perfil' : 'Perfil no disponible'}
          description={
            state === 'error'
              ? 'Inténtalo de nuevo en unos minutos.'
              : 'Este perfil no existe o no es público.'
          }
          action={
            <Link
              to="/login"
              className="text-sm font-medium text-coffee-700 underline-offset-2 hover:underline"
            >
              Ir a la aplicación
            </Link>
          }
        />
      </main>
    );
  }

  const unlockedAchievements = achievements.filter((achievement) => achievement.achieved);

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-coffee-100 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand />
          <Link
            to="/login"
            className="text-sm font-medium text-coffee-500 underline-offset-2 hover:underline"
          >
            Crea tu contador
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-coffee-900">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-sm text-coffee-400">@{profile.username}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coffee-100 px-3 py-1 text-xs font-medium text-coffee-600">
            <Eye className="size-3.5" aria-hidden />
            Perfil público de solo lectura
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CoffeeIcon className="size-5" aria-hidden />}
            label="Total de cafés"
            value={formatInteger(historic.total)}
            sub={
              historic.firstCoffee
                ? `Desde el ${formatDate(historic.firstCoffee.takenAt)}`
                : undefined
            }
          />
          <StatCard
            icon={<BarChart3 className="size-5" aria-hidden />}
            label="Promedio diario"
            value={formatNumber(historic.dailyAvg)}
            sub="Cafés por día registrado"
          />
          <StatCard
            icon={<CalendarDays className="size-5" aria-hidden />}
            label="Promedio semanal"
            value={formatNumber(historic.weeklyAvg)}
          />
          <StatCard
            icon={<Clock className="size-5" aria-hidden />}
            label="Intervalo medio"
            value={
              curious.avgIntervalMinutes !== null
                ? formatDuration(curious.avgIntervalMinutes)
                : '—'
            }
            sub="Entre cafés del mismo día"
          />
        </div>

        {profile.showCharts && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title="Evolución diaria"
                  subtitle="Últimos 30 días"
                  icon={<LineChart className="size-4" aria-hidden />}
                />
                <SeriesChart data={daily} type="area" />
              </Card>
              <Card>
                <CardHeader
                  title="Cafés por hora del día"
                  icon={<Clock className="size-4" aria-hidden />}
                />
                <SeriesChart data={hourly} tickInterval={2} />
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Evolución mensual"
                  subtitle="Últimos 12 meses"
                  icon={<BarChart3 className="size-4" aria-hidden />}
                />
                <SeriesChart data={monthly} tickInterval={0} color={chartColors.coffeeDark} />
              </Card>
            </div>
            <Card>
              <CardHeader
                title="Calendario de consumo"
                subtitle="Último año"
                icon={<CalendarDays className="size-4" aria-hidden />}
              />
              <CalendarHeatmap coffees={coffees} now={now} />
            </Card>
          </>
        )}

        {profile.showHistory && recentCoffees.length > 0 && (
          <Card>
            <CardHeader
              title="Últimos cafés"
              subtitle="Los 10 más recientes"
              icon={<History className="size-4" aria-hidden />}
            />
            <ul className="divide-y divide-coffee-100">
              {recentCoffees.map((coffee) => (
                <li key={coffee.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600">
                    <CoffeeIcon className="size-4" aria-hidden />
                  </span>
                  <span className="text-sm font-medium tabular-nums text-coffee-900">
                    {formatTime(coffee.takenAt)}
                  </span>
                  <span className="text-sm text-coffee-400">{formatDate(coffee.takenAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {profile.showAdvancedStats && coffees.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-coffee-900">
              Estadísticas curiosas
            </h2>
            <CuriousStatsGrid stats={curious} />
          </section>
        )}

        {profile.showAchievements && unlockedAchievements.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-coffee-900">
              <Trophy className="size-4 text-amber-500" aria-hidden />
              Logros conseguidos ({unlockedAchievements.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-coffee-100 py-6 text-center text-xs text-coffee-400">
          {historic.total} {coffeeLabel(historic.total)} registrados con Contador de cafés
        </footer>
      </main>
    </div>
  );
}
