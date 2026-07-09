import { useMemo } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  Hourglass,
  LineChart,
  Sun,
  Trophy,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatList, type StatListItem } from '@/components/stats/StatList';
import { CuriousStatsGrid } from '@/components/stats/CuriousStatsGrid';
import { SeriesChart } from '@/components/charts/SeriesChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { chartColors } from '@/components/charts/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCoffees } from '@/hooks/useCoffees';
import { useNow } from '@/hooks/useNow';
import {
  computeHistoricStats,
  computeMonthStats,
  computeTodayStats,
  computeWeekStats,
} from '@/utils/stats';
import { computeCuriousStats } from '@/utils/curiousStats';
import {
  dailySeries,
  hourlyDistribution,
  intervalHistogram,
  monthlyAverageSeries,
  monthlySeries,
  weeklySeries,
} from '@/utils/chartData';
import { formatDuration, formatWeekdayName } from '@/utils/dates';
import { coffeeLabel, formatInteger, formatNumber } from '@/utils/format';

export default function StatsPage() {
  const { profile } = useAuth();
  const { coffees, loading } = useCoffees();
  const now = useNow(60_000);

  const today = useMemo(() => computeTodayStats(coffees, now), [coffees, now]);
  const week = useMemo(() => computeWeekStats(coffees, now), [coffees, now]);
  const month = useMemo(() => computeMonthStats(coffees, now), [coffees, now]);
  const historic = useMemo(() => computeHistoricStats(coffees, profile), [coffees, profile]);

  const daily = useMemo(() => dailySeries(coffees, now), [coffees, now]);
  const weekly = useMemo(() => weeklySeries(coffees, now), [coffees, now]);
  const monthly = useMemo(() => monthlySeries(coffees, now), [coffees, now]);
  const hourly = useMemo(() => hourlyDistribution(coffees), [coffees]);
  const intervals = useMemo(() => intervalHistogram(coffees), [coffees]);
  const monthlyAvg = useMemo(() => monthlyAverageSeries(coffees, now), [coffees, now]);
  const curious = useMemo(() => computeCuriousStats(coffees), [coffees]);

  if (loading) return <Spinner label="Calculando estadísticas..." />;

  const todayItems: StatListItem[] = [
    { label: 'Cafés', value: formatInteger(today.count) },
    {
      label: 'Cafés por hora',
      value: today.coffeesPerHour !== null ? formatNumber(today.coffeesPerHour) : '—',
    },
    {
      label: 'Media entre cafés',
      value: today.avgIntervalMinutes !== null ? formatDuration(today.avgIntervalMinutes) : '—',
    },
  ];

  const weekItems: StatListItem[] = [
    { label: 'Total', value: formatInteger(week.total) },
    { label: 'Media diaria', value: formatNumber(week.dailyAvg) },
    {
      label: 'Día con más cafés',
      icon: <Zap className="size-3.5 text-amber-500" aria-hidden />,
      value: week.maxDay
        ? `${formatWeekdayName(week.maxDay.dateKey)} (${week.maxDay.count})`
        : '—',
    },
    {
      label: 'Día con menos cafés',
      icon: <Trophy className="size-3.5 text-emerald-500" aria-hidden />,
      value: week.minDay
        ? `${formatWeekdayName(week.minDay.dateKey)} (${week.minDay.count})`
        : '—',
    },
  ];

  // Comparación: más cafés que el mes anterior en rojo, menos en verde.
  const monthDelta = month.total - month.previousTotal;
  const monthItems: StatListItem[] = [
    { label: 'Total', value: formatInteger(month.total) },
    { label: 'Media diaria', value: formatNumber(month.dailyAvg) },
    { label: 'Media semanal', value: formatNumber(month.weeklyAvg) },
    {
      label: 'Respecto al mes anterior',
      value:
        monthDelta === 0
          ? `Igual (${formatInteger(month.previousTotal)})`
          : `${monthDelta > 0 ? '+' : ''}${formatInteger(monthDelta)} (antes ${formatInteger(month.previousTotal)})`,
      tone: monthDelta > 0 ? 'negative' : monthDelta < 0 ? 'positive' : 'default',
    },
  ];

  const historicItems: StatListItem[] = [
    { label: 'Total de cafés', value: formatInteger(historic.total) },
    { label: 'Promedio diario', value: formatNumber(historic.dailyAvg) },
    { label: 'Promedio semanal', value: formatNumber(historic.weeklyAvg) },
    { label: 'Promedio mensual', value: formatNumber(historic.monthlyAvg) },
    {
      label: 'Horas trabajadas',
      value:
        historic.totalWorkedHours !== null
          ? `${formatInteger(historic.totalWorkedHours)} h`
          : '—',
    },
    {
      label: 'Tiempo total entre cafés',
      value: historic.totalIntervalMinutes > 0 ? formatDuration(historic.totalIntervalMinutes) : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-coffee-900">Estadísticas</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Hoy" icon={<Sun className="size-4" aria-hidden />} />
          <StatList items={todayItems} />
        </Card>
        <Card>
          <CardHeader title="Esta semana" icon={<CalendarDays className="size-4" aria-hidden />} />
          <StatList items={weekItems} />
        </Card>
        <Card>
          <CardHeader title="Este mes" icon={<CalendarRange className="size-4" aria-hidden />} />
          <StatList items={monthItems} />
        </Card>
        <Card>
          <CardHeader title="Histórico" icon={<BarChart3 className="size-4" aria-hidden />} />
          <StatList items={historicItems} />
        </Card>
      </div>

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
            title="Evolución semanal"
            subtitle="Últimas 12 semanas (semana del lunes indicado)"
            icon={<BarChart3 className="size-4" aria-hidden />}
          />
          <SeriesChart data={weekly} tickInterval={0} />
        </Card>
        <Card>
          <CardHeader
            title="Evolución mensual"
            subtitle="Últimos 12 meses"
            icon={<BarChart3 className="size-4" aria-hidden />}
          />
          <SeriesChart data={monthly} tickInterval={0} color={chartColors.coffeeDark} />
        </Card>
        <Card>
          <CardHeader
            title="Cafés por hora del día"
            subtitle="Todo el histórico"
            icon={<Clock className="size-4" aria-hidden />}
          />
          <SeriesChart data={hourly} tickInterval={2} />
        </Card>
        <Card>
          <CardHeader
            title="Tiempo entre cafés"
            subtitle="Histograma de intervalos del mismo día"
            icon={<Hourglass className="size-4" aria-hidden />}
          />
          <SeriesChart data={intervals} tickInterval={0} color={chartColors.amber} name="Intervalos" />
        </Card>
        <Card>
          <CardHeader
            title="Promedio mensual"
            subtitle="Cafés por día registrado en cada mes"
            icon={<LineChart className="size-4" aria-hidden />}
          />
          <SeriesChart data={monthlyAvg} type="line" color={chartColors.green} name="Media diaria" />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Calendario de consumo"
          subtitle="Último año: 1-2 cafés en verde, 3 en naranja, 4 o más en rojo"
          icon={<CalendarDays className="size-4" aria-hidden />}
        />
        <CalendarHeatmap coffees={coffees} now={now} />
        <p className="mt-1 text-xs text-coffee-400">
          {historic.total} {coffeeLabel(historic.total)} registrados en total
        </p>
      </Card>

      {coffees.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-coffee-900">Estadísticas curiosas</h2>
          <CuriousStatsGrid stats={curious} />
        </section>
      )}
    </div>
  );
}
