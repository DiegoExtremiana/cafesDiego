import { useMemo } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  Flame,
  Hourglass,
  LineChart,
  Sun,
  Trophy,
  Zap,
  ZapOff,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatList, type StatListItem } from '@/components/stats/StatList';
import { CuriousStatsGrid } from '@/components/stats/CuriousStatsGrid';
import { SeriesChart } from '@/components/charts/SeriesChart';
import { ExpandableChart } from '@/components/charts/ExpandableChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { RingChart, type RingSegment } from '@/components/charts/RingChart';
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
  caffeineBreakdown,
  dailySeries,
  hourlyDistribution,
  intervalHistogram,
  monthlyAverageSeries,
  monthlySeries,
  weeklySeries,
} from '@/utils/chartData';
import { formatDuration, formatWeekdayName } from '@/utils/dates';
import {
  drinkLabel,
  formatEspressos,
  formatInteger,
  formatMg,
  formatNumber,
} from '@/utils/format';
import { espressoEquivalent } from '@/types/coffee';

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
  const caffeine = useMemo(() => caffeineBreakdown(coffees), [coffees]);

  // Series completas (todo el histórico) para la vista ampliada de cada gráfico.
  const dailyFull = useMemo(() => dailySeries(coffees, now, 'all'), [coffees, now]);
  const weeklyFull = useMemo(() => weeklySeries(coffees, now, 'all'), [coffees, now]);
  const monthlyFull = useMemo(() => monthlySeries(coffees, now, 'all'), [coffees, now]);
  const monthlyAvgFull = useMemo(() => monthlyAverageSeries(coffees, now, 'all'), [coffees, now]);
  const curious = useMemo(() => computeCuriousStats(coffees), [coffees]);

  if (loading) return <Spinner label="Calculando estadísticas..." />;

  const caffeineTotal = caffeine.reduce((sum, point) => sum + point.count, 0);
  const caffeineRing: RingSegment[] = caffeine.map((point) => ({
    key: point.key,
    label: point.label,
    value: point.count,
    color: point.key === 'caffeine' ? chartColors.amber : chartColors.green,
  }));

  const todayItems: StatListItem[] = [
    { label: 'Cafeína', value: formatMg(today.mg) },
    { label: 'Equivalencia', value: formatEspressos(espressoEquivalent(today.mg)) },
    {
      label: 'Cafeína por hora',
      value: today.mgPerHour !== null ? `${formatInteger(today.mgPerHour)} mg/h` : '—',
    },
    {
      label: 'Media entre bebidas',
      value: today.avgIntervalMinutes !== null ? formatDuration(today.avgIntervalMinutes) : '—',
    },
  ];

  const weekItems: StatListItem[] = [
    { label: 'Total', value: formatMg(week.total) },
    { label: 'Media diaria', value: formatMg(week.dailyAvg) },
    {
      label: 'Día con más cafeína',
      icon: <Zap className="size-3.5 text-amber-500" aria-hidden />,
      value: week.maxDay
        ? `${formatWeekdayName(week.maxDay.dateKey)} (${formatMg(week.maxDay.count)})`
        : '—',
    },
    {
      label: 'Día con menos cafeína',
      icon: <Trophy className="size-3.5 text-emerald-500" aria-hidden />,
      value: week.minDay
        ? `${formatWeekdayName(week.minDay.dateKey)} (${formatMg(week.minDay.count)})`
        : '—',
    },
  ];

  // Comparación: más cafés que el mes anterior en rojo, menos en verde.
  const monthDelta = month.total - month.previousTotal;
  const monthItems: StatListItem[] = [
    { label: 'Total', value: formatMg(month.total) },
    { label: 'Media diaria', value: formatMg(month.dailyAvg) },
    { label: 'Media semanal', value: formatMg(month.weeklyAvg) },
    {
      label: 'Respecto al mes anterior',
      value:
        monthDelta === 0
          ? `Igual (${formatMg(month.previousTotal)})`
          : `${monthDelta > 0 ? '+' : ''}${formatMg(monthDelta)} (antes ${formatMg(month.previousTotal)})`,
      tone: monthDelta > 0 ? 'negative' : monthDelta < 0 ? 'positive' : 'default',
    },
  ];

  const historicItems: StatListItem[] = [
    { label: 'Cafeína total', value: formatMg(historic.total) },
    { label: 'Equivalencia', value: formatEspressos(espressoEquivalent(historic.total)) },
    { label: 'Promedio diario', value: formatMg(historic.dailyAvg) },
    { label: 'Promedio semanal', value: formatMg(historic.weeklyAvg) },
    { label: 'Promedio mensual', value: formatMg(historic.monthlyAvg) },
    {
      label: 'Horas trabajadas',
      value:
        historic.totalWorkedHours !== null
          ? `${formatInteger(historic.totalWorkedHours)} h`
          : '—',
    },
    {
      label: 'Tiempo total entre bebidas',
      value: historic.totalIntervalMinutes > 0 ? formatDuration(historic.totalIntervalMinutes) : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-coffee-900">Estadísticas</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {(() => {
        const chartCards = [
          {
            key: 'daily',
            title: 'Evolución diaria',
            subtitle: 'Últimos 30 días',
            icon: <LineChart className="size-4" aria-hidden />,
            content: <SeriesChart data={daily} type="area" />,
            expanded: <SeriesChart data={dailyFull} type="area" tickInterval={6} height={320} />,
            expandedMinWidth: Math.max(700, dailyFull.length * 26),
          },
          {
            key: 'weekly',
            title: 'Evolución semanal',
            subtitle: 'Últimas 12 semanas (semana del lunes indicado)',
            icon: <BarChart3 className="size-4" aria-hidden />,
            content: <SeriesChart data={weekly} tickInterval={0} />,
            expanded: <SeriesChart data={weeklyFull} tickInterval={0} height={320} />,
            expandedMinWidth: Math.max(700, weeklyFull.length * 42),
          },
          {
            key: 'monthly',
            title: 'Evolución mensual',
            subtitle: 'Últimos 12 meses',
            icon: <BarChart3 className="size-4" aria-hidden />,
            content: <SeriesChart data={monthly} tickInterval={0} color={chartColors.coffeeDark} />,
            expanded: (
              <SeriesChart data={monthlyFull} tickInterval={0} color={chartColors.coffeeDark} height={320} />
            ),
            expandedMinWidth: Math.max(700, monthlyFull.length * 50),
          },
          {
            key: 'hourly',
            title: 'Cafeína por hora del día',
            subtitle: 'Todo el histórico',
            icon: <Clock className="size-4" aria-hidden />,
            content: <SeriesChart data={hourly} tickInterval={2} />,
            expanded: <SeriesChart data={hourly} tickInterval={0} height={320} />,
            expandedMinWidth: hourly.length * 34,
          },
          {
            key: 'intervals',
            title: 'Tiempo entre cafés',
            subtitle: 'Histograma de intervalos del mismo día',
            icon: <Hourglass className="size-4" aria-hidden />,
            content: (
              <SeriesChart data={intervals} tickInterval={0} color={chartColors.amber} name="Intervalos" />
            ),
            expanded: undefined,
            expandedMinWidth: undefined,
          },
          {
            key: 'monthlyAvg',
            title: 'Promedio mensual',
            subtitle: 'Media de mg de cafeína por día registrado en cada mes',
            icon: <LineChart className="size-4" aria-hidden />,
            content: (
              <SeriesChart data={monthlyAvg} type="line" color={chartColors.green} name="Media diaria (mg)" />
            ),
            expanded: (
              <SeriesChart data={monthlyAvgFull} type="line" color={chartColors.green} name="Media diaria (mg)" height={320} />
            ),
            expandedMinWidth: Math.max(700, monthlyAvgFull.length * 50),
          },
          {
            key: 'caffeine',
            title: 'Cafeína',
            subtitle: 'Bebidas con cafeína frente a sin cafeína',
            icon: <Flame className="size-4" aria-hidden />,
            content: (
              <div className="flex flex-col gap-3">
                <RingChart
                  data={caffeineRing}
                  centerValue={formatInteger(caffeineTotal)}
                  centerLabel={drinkLabel(caffeineTotal)}
                />
                <div className="grid grid-cols-2 gap-2">
                  {caffeineRing.map((segment) => {
                    const Icon = segment.key === 'caffeine' ? Zap : ZapOff;
                    const pct =
                      caffeineTotal > 0 ? Math.round((segment.value / caffeineTotal) * 100) : 0;
                    return (
                      <div
                        key={segment.key}
                        className="rounded-xl border px-3 py-2"
                        style={{
                          borderColor: `${segment.color}55`,
                          backgroundColor: `${segment.color}14`,
                        }}
                      >
                        <div
                          className="flex items-center justify-between text-sm font-semibold"
                          style={{ color: segment.color }}
                        >
                          <span className="flex items-center gap-1.5">
                            <Icon className="size-3.5" aria-hidden />
                            {segment.label}
                          </span>
                          <span>{formatNumber(segment.value)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-coffee-400">{pct}% del total</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
            expanded: undefined,
            expandedMinWidth: undefined,
          },
        ];

        return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {chartCards.map((chart, index) => (
              <ExpandableChart
                key={chart.key}
                title={chart.title}
                subtitle={chart.subtitle}
                icon={chart.icon}
                expanded={chart.expanded}
                expandedMinWidth={chart.expandedMinWidth}
                className={
                  chartCards.length % 2 === 1 && index === chartCards.length - 1
                    ? 'lg:col-span-2 xl:col-span-1'
                    : ''
                }
              >
                {chart.content}
              </ExpandableChart>
            ))}
          </div>
        );
      })()}

      <Card>
        <CardHeader
          title="Calendario de consumo"
          subtitle="Último año: hasta ~2 espressos en verde, ~3 en naranja, 4 o más en rojo"
          icon={<CalendarDays className="size-4" aria-hidden />}
        />
        <CalendarHeatmap coffees={coffees} now={now} />
        <p className="mt-1 text-xs text-coffee-400">
          {formatInteger(historic.totalDrinks)} {drinkLabel(historic.totalDrinks)} registradas en total
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
