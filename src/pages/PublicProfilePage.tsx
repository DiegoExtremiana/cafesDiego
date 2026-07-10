import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Coffee as CoffeeIcon,
  Eye,
  History,
  LineChart,
  Share2,
  Sun,
  Trophy,
  Zap,
  ZapOff,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Brand } from '@/components/layout/Brand';
import { StatCard } from '@/components/dashboard/StatCard';
import { CuriousStatsGrid } from '@/components/stats/CuriousStatsGrid';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { CoffeeTypeIcon } from '@/components/coffee/CoffeeTypeIcon';
import { SeriesChart } from '@/components/charts/SeriesChart';
import { ExpandableChart } from '@/components/charts/ExpandableChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { chartColors } from '@/components/charts/theme';
import { getPublicProfile } from '@/services/profileService';
import { listCoffees } from '@/services/coffeeService';
import { coffeesOfDay, computeHistoricStats, computeTodayStats, computeWeekStats } from '@/utils/stats';
import { computeCuriousStats } from '@/utils/curiousStats';
import { computeAchievements } from '@/utils/achievements';
import { caffeineBreakdown, dailySeries, hourlyDistribution, monthlySeries } from '@/utils/chartData';
import { addDays, formatDate, formatDuration, formatTime, formatWeekdayName, startOfWeek } from '@/utils/dates';
import { coffeeLabel, formatNumber } from '@/utils/format';
import type { Profile } from '@/types/profile';
import { COFFEE_TYPE_LABELS, sumCoffeeValue, type Coffee } from '@/types/coffee';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';
type Section = 'hoy' | 'semana' | 'general';

const SECTIONS: { key: Section; label: string; icon: typeof Sun }[] = [
  { key: 'hoy', label: 'Hoy', icon: Sun },
  { key: 'semana', label: 'Esta semana', icon: CalendarDays },
  { key: 'general', label: 'General', icon: BarChart3 },
];

export default function PublicProfilePage() {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const now = useMemo(() => new Date(), []);

  const sectionParam = searchParams.get('section');
  const section: Section = sectionParam === 'hoy' || sectionParam === 'semana' ? sectionParam : 'general';

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

  const today = useMemo(() => computeTodayStats(coffees, now), [coffees, now]);
  const todayCoffees = useMemo(() => coffeesOfDay(coffees, now), [coffees, now]);
  const todayCaffeineCount = useMemo(
    () => sumCoffeeValue(todayCoffees.filter((coffee) => coffee.hasCaffeine)),
    [todayCoffees],
  );
  const week = useMemo(() => computeWeekStats(coffees, now), [coffees, now]);
  const weekCaffeineCount = useMemo(() => {
    const start = startOfWeek(now);
    const end = addDays(start, 7);
    return sumCoffeeValue(
      coffees.filter(
        (coffee) => coffee.takenAt >= start && coffee.takenAt < end && coffee.hasCaffeine,
      ),
    );
  }, [coffees, now]);
  const weekly7 = useMemo(() => dailySeries(coffees, now, 7), [coffees, now]);
  const historic = useMemo(() => computeHistoricStats(coffees, profile), [coffees, profile]);
  const historicCaffeine = useMemo(() => caffeineBreakdown(coffees), [coffees]);
  const historicCaffeineCount = historicCaffeine.find((point) => point.key === 'caffeine')?.count ?? 0;
  const historicDecafCount = historicCaffeine.find((point) => point.key === 'decaf')?.count ?? 0;
  const curious = useMemo(() => computeCuriousStats(coffees), [coffees]);
  const achievements = useMemo(() => computeAchievements(coffees), [coffees]);
  const daily = useMemo(() => dailySeries(coffees, now), [coffees, now]);
  const monthly = useMemo(() => monthlySeries(coffees, now), [coffees, now]);
  const hourly = useMemo(() => hourlyDistribution(coffees), [coffees]);
  const recentCoffees = useMemo(() => coffees.slice(-10).reverse(), [coffees]);

  // Series completas (todo el histórico) para la vista ampliada de cada gráfico.
  const dailyFull = useMemo(() => dailySeries(coffees, now, 'all'), [coffees, now]);
  const monthlyFull = useMemo(() => monthlySeries(coffees, now, 'all'), [coffees, now]);

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

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = `Café de ${profile.displayName || profile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // El usuario canceló el share nativo o no está soportado del todo: caer a copiar.
      }
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-coffee-100 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand />
          <Link
            to="/"
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            className="inline-flex rounded-xl border border-coffee-200 bg-white p-1"
            aria-label="Secciones"
          >
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSearchParams(key === 'general' ? {} : { section: key })}
                aria-pressed={section === key}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  section === key
                    ? 'bg-coffee-600 text-white'
                    : 'text-coffee-500 hover:bg-coffee-50'
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
          <Button type="button" variant="secondary" size="sm" onClick={handleShare}>
            {shareCopied ? (
              <Check className="size-3.5 text-emerald-600" aria-hidden />
            ) : (
              <Share2 className="size-3.5" aria-hidden />
            )}
            {shareCopied ? 'Copiado' : 'Compartir'}
          </Button>
        </div>

        {section === 'hoy' && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard
                icon={<CoffeeIcon className="size-5" aria-hidden />}
                label="Cafés hoy"
                value={formatNumber(today.count)}
                sub={`${formatNumber(todayCaffeineCount)} con cafeína · ${formatNumber(today.count - todayCaffeineCount)} sin`}
              />
              <StatCard
                icon={<Zap className="size-5" aria-hidden />}
                label="Ritmo"
                value={today.coffeesPerHour !== null ? `${formatNumber(today.coffeesPerHour)} /h` : '—'}
                sub="Cafés por hora"
              />
              <StatCard
                icon={<Clock className="size-5" aria-hidden />}
                label="Media entre cafés"
                value={today.avgIntervalMinutes !== null ? formatDuration(today.avgIntervalMinutes) : '—'}
              />
            </div>
            {profile.showHistory &&
              (todayCoffees.length > 0 ? (
                <Card>
                  <CardHeader
                    title="Cafés de hoy"
                    subtitle={`${formatNumber(todayCaffeineCount)} con cafeína · ${formatNumber(today.count - todayCaffeineCount)} sin cafeína`}
                    icon={<History className="size-4" aria-hidden />}
                  />
                  <ul className="divide-y divide-coffee-100">
                    {todayCoffees.map((coffee) => (
                      <li key={coffee.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600">
                            <CoffeeTypeIcon type={coffee.type} className="size-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium tabular-nums text-coffee-900">
                              {formatTime(coffee.takenAt)}
                            </p>
                            <p className="text-xs text-coffee-400">
                              {COFFEE_TYPE_LABELS[coffee.type]}
                            </p>
                          </div>
                        </div>
                        {coffee.hasCaffeine ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Zap className="size-3.5" aria-hidden />
                            Con cafeína
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-coffee-400">
                            <ZapOff className="size-3.5" aria-hidden />
                            Sin cafeína
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : (
                <EmptyState
                  icon={<CoffeeIcon className="size-10" aria-hidden />}
                  title="Sin cafés hoy todavía"
                  description="Vuelve más tarde para ver el progreso del día."
                />
              ))}
          </>
        )}

        {section === 'semana' && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<CoffeeIcon className="size-5" aria-hidden />}
                label="Total semana"
                value={formatNumber(week.total)}
                sub={`${formatNumber(weekCaffeineCount)} con cafeína · ${formatNumber(week.total - weekCaffeineCount)} sin`}
              />
              <StatCard
                icon={<BarChart3 className="size-5" aria-hidden />}
                label="Media diaria"
                value={formatNumber(week.dailyAvg)}
              />
              <StatCard
                icon={<Zap className="size-5" aria-hidden />}
                label="Día con más"
                value={
                  week.maxDay
                    ? `${formatWeekdayName(week.maxDay.dateKey)} (${formatNumber(week.maxDay.count)})`
                    : '—'
                }
              />
              <StatCard
                icon={<Trophy className="size-5" aria-hidden />}
                label="Día con menos"
                value={
                  week.minDay
                    ? `${formatWeekdayName(week.minDay.dateKey)} (${formatNumber(week.minDay.count)})`
                    : '—'
                }
              />
            </div>
            {profile.showCharts && (
              <ExpandableChart
                title="Últimos 7 días"
                icon={<LineChart className="size-4" aria-hidden />}
                expanded={<SeriesChart data={dailyFull} type="bar" height={320} tickInterval={6} />}
                expandedMinWidth={Math.max(700, dailyFull.length * 26)}
              >
                <SeriesChart data={weekly7} type="bar" />
              </ExpandableChart>
            )}
          </>
        )}

        {section === 'general' && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<CoffeeIcon className="size-5" aria-hidden />}
                label="Total de cafés"
                value={formatNumber(historic.total)}
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
              <StatCard
                icon={<Zap className="size-5" aria-hidden />}
                label="Con cafeína"
                value={formatNumber(historicCaffeineCount)}
                sub={`${formatNumber(historicDecafCount)} sin cafeína`}
              />
            </div>

            {profile.showCharts && (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ExpandableChart
                    title="Evolución diaria"
                    subtitle="Últimos 30 días"
                    icon={<LineChart className="size-4" aria-hidden />}
                    expanded={<SeriesChart data={dailyFull} type="area" height={320} tickInterval={6} />}
                    expandedMinWidth={Math.max(700, dailyFull.length * 26)}
                  >
                    <SeriesChart data={daily} type="area" />
                  </ExpandableChart>
                  <ExpandableChart
                    title="Cafés por hora del día"
                    icon={<Clock className="size-4" aria-hidden />}
                    expanded={<SeriesChart data={hourly} tickInterval={0} height={320} />}
                    expandedMinWidth={hourly.length * 34}
                  >
                    <SeriesChart data={hourly} tickInterval={2} />
                  </ExpandableChart>
                  <ExpandableChart
                    title="Evolución mensual"
                    subtitle="Últimos 12 meses"
                    icon={<BarChart3 className="size-4" aria-hidden />}
                    className="lg:col-span-2"
                    expanded={
                      <SeriesChart data={monthlyFull} tickInterval={0} color={chartColors.coffeeDark} height={320} />
                    }
                    expandedMinWidth={Math.max(700, monthlyFull.length * 50)}
                  >
                    <SeriesChart data={monthly} tickInterval={0} color={chartColors.coffeeDark} />
                  </ExpandableChart>
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
                    <li key={coffee.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600">
                          <CoffeeTypeIcon type={coffee.type} className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium tabular-nums text-coffee-900">
                            {formatTime(coffee.takenAt)} · {formatDate(coffee.takenAt)}
                          </p>
                          <p className="text-xs text-coffee-400">{COFFEE_TYPE_LABELS[coffee.type]}</p>
                        </div>
                      </div>
                      {coffee.hasCaffeine ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Zap className="size-3.5" aria-hidden />
                          Con cafeína
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-coffee-400">
                          <ZapOff className="size-3.5" aria-hidden />
                          Sin cafeína
                        </span>
                      )}
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
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {unlockedAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="border-t border-coffee-100 py-6 text-center text-xs text-coffee-400">
          {formatNumber(historic.total)} {coffeeLabel(historic.total)} registrados con Contador de cafés
        </footer>
      </main>
    </div>
  );
}
