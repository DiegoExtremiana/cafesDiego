import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlarmClock,
  Coffee as CoffeeIcon,
  Gauge,
  History,
  Hourglass,
  Timer,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatCard } from '@/components/dashboard/StatCard';
import { RegisterCoffeeButton } from '@/components/coffee/RegisterCoffeeButton';
import { CoffeeList } from '@/components/coffee/CoffeeList';
import { CoffeeFormModal } from '@/components/coffee/CoffeeFormModal';
import { useAuth } from '@/hooks/useAuth';
import { useCoffees } from '@/hooks/useCoffees';
import { useNow } from '@/hooks/useNow';
import { computeDashboardStats, coffeesOfDay } from '@/utils/stats';
import { formatDuration, formatTime, formatDateLong } from '@/utils/dates';
import { coffeeLabel, formatNumber } from '@/utils/format';
import type { Coffee, CoffeeDetails } from '@/types/coffee';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { coffees, loading, error, editCoffee, updateCoffeeDetails, removeCoffee } = useCoffees();
  const now = useNow();
  const [editing, setEditing] = useState<Coffee | null>(null);
  const [deleting, setDeleting] = useState<Coffee | null>(null);

  const stats = useMemo(() => computeDashboardStats(coffees, now), [coffees, now]);
  const todayCoffees = useMemo(() => coffeesOfDay(coffees, now), [coffees, now]);

  if (loading) return <Spinner label="Preparando tu panel..." />;

  const greeting =
    now.getHours() < 14 ? 'Buenos días' : now.getHours() < 21 ? 'Buenas tardes' : 'Buenas noches';
  const nextIsPast =
    stats.nextCoffeeEstimate !== null && stats.nextCoffeeEstimate.getTime() <= now.getTime();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-coffee-900">
          {greeting}
          {profile?.displayName ? `, ${profile.displayName}` : ''}
        </h1>
        <p className="text-sm capitalize text-coffee-400">{formatDateLong(now)}</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex justify-center py-4">
        <RegisterCoffeeButton />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<CoffeeIcon className="size-5" aria-hidden />}
          label="Cafés hoy"
          value={String(stats.todayCount)}
          sub={
            stats.todayCount === 0
              ? 'Todavía ninguno'
              : `Último a las ${formatTime(todayCoffees.at(-1)?.takenAt ?? now)}`
          }
        />
        <StatCard
          icon={<Timer className="size-5" aria-hidden />}
          label="Desde el último café"
          value={stats.minutesSinceLast !== null ? formatDuration(stats.minutesSinceLast) : '—'}
        />
        <StatCard
          icon={<Gauge className="size-5" aria-hidden />}
          label="Ritmo de consumo"
          value={
            stats.coffeesPerHourToday !== null
              ? `${formatNumber(stats.coffeesPerHourToday)} /h`
              : '—'
          }
          sub="Cafés por hora hoy"
        />
        <StatCard
          icon={<Hourglass className="size-5" aria-hidden />}
          label="Media entre cafés"
          value={
            stats.todayAvgIntervalMinutes !== null
              ? formatDuration(stats.todayAvgIntervalMinutes)
              : stats.historicAvgIntervalMinutes !== null
                ? formatDuration(stats.historicAvgIntervalMinutes)
                : '—'
          }
          sub={stats.todayAvgIntervalMinutes !== null ? 'Hoy' : 'Media histórica'}
        />
        <StatCard
          icon={<AlarmClock className="size-5" aria-hidden />}
          label="Siguiente café"
          value={
            stats.nextCoffeeEstimate
              ? nextIsPast
                ? 'Ya toca'
                : formatTime(stats.nextCoffeeEstimate)
              : '—'
          }
          sub="Según tu histórico"
          tone={nextIsPast ? 'positive' : 'default'}
        />
      </div>

      <Card>
        <CardHeader title="Consumo de hoy" icon={<Gauge className="size-4" aria-hidden />} />
        <div className="flex flex-col gap-4">
          <div>
            {profile?.maxDailyCaffeine != null ? (
              <ProgressBar
                value={stats.todayCaffeineCount}
                max={profile.maxDailyCaffeine}
                label="Cafeína"
              />
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-coffee-600">
                  <Zap className="size-4 text-amber-500" aria-hidden />
                  Cafeína
                </span>
                <span className="font-semibold tabular-nums text-coffee-900">
                  {stats.todayCaffeineCount}
                </span>
              </div>
            )}
            {profile?.maxDailyCaffeine != null &&
              stats.todayCaffeineCount >= profile.maxDailyCaffeine && (
                <p className="mt-1.5 text-xs text-red-600">
                  Has alcanzado tu máximo de cafeína de hoy.
                </p>
              )}
          </div>
          <div>
            {profile?.maxDailyCoffees != null ? (
              <ProgressBar value={stats.todayCount} max={profile.maxDailyCoffees} label="Cafés" />
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-coffee-600">
                  <CoffeeIcon className="size-4 text-coffee-500" aria-hidden />
                  Cafés
                </span>
                <span className="font-semibold tabular-nums text-coffee-900">
                  {stats.todayCount}
                </span>
              </div>
            )}
            {profile?.maxDailyCoffees != null && stats.todayCount >= profile.maxDailyCoffees && (
              <p className="mt-1.5 text-xs text-red-600">
                Has alcanzado tu máximo recomendado de hoy. Quizá toque descafeinado.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Cafés de hoy"
          subtitle={`${todayCoffees.length} ${coffeeLabel(todayCoffees.length)}`}
          icon={<History className="size-4" aria-hidden />}
          actions={
            <Link
              to="/historial"
              className="text-xs font-medium text-coffee-500 underline-offset-2 hover:underline"
            >
              Ver historial completo
            </Link>
          }
        />
        <CoffeeList
          coffees={todayCoffees}
          onEdit={setEditing}
          onDelete={setDeleting}
          onUpdateDetails={(coffee: Coffee, details: CoffeeDetails) =>
            updateCoffeeDetails(coffee.id, details)
          }
        />
      </Card>

      <CoffeeFormModal
        open={editing !== null}
        coffee={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (takenAt) => {
          if (editing) await editCoffee(editing.id, takenAt);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar café"
        message={
          deleting
            ? `¿Seguro que quieres eliminar el café de las ${formatTime(deleting.takenAt)}?`
            : ''
        }
        onConfirm={async () => {
          if (deleting) {
            await removeCoffee(deleting.id);
            setDeleting(null);
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
