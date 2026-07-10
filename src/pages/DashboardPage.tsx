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
import { drinkLabel, formatEspressos, formatInteger, formatMg } from '@/utils/format';
import { espressoEquivalent, type Coffee, type CoffeeDetails } from '@/types/coffee';

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

      <Card>
        <CardHeader title="Bebidas de hoy" icon={<Gauge className="size-4" aria-hidden />} />
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg font-bold text-coffee-900">
              Has consumido {formatMg(stats.todayMg)} de cafeína
            </p>
            <p className="text-sm text-coffee-400">
              Equivale aproximadamente a{' '}
              {formatEspressos(espressoEquivalent(stats.todayMg)).replace('≈ ', '')}.
            </p>
          </div>
          <div>
            {profile?.maxDailyCaffeine != null ? (
              profile.caffeineLimitUnit === 'cafes' ? (
                <ProgressBar
                  value={espressoEquivalent(stats.todayMg)}
                  max={espressoEquivalent(profile.maxDailyCaffeine)}
                  label="Cafeína (cafés)"
                />
              ) : (
                <ProgressBar
                  value={stats.todayMg}
                  max={profile.maxDailyCaffeine}
                  label="Cafeína (mg)"
                />
              )
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-coffee-600">
                  <Zap className="size-4 text-amber-500" aria-hidden />
                  Cafeína
                </span>
                <span className="font-semibold tabular-nums text-coffee-900">
                  {formatMg(stats.todayMg)}
                </span>
              </div>
            )}
            {profile?.maxDailyCaffeine != null && stats.todayMg >= profile.maxDailyCaffeine && (
              <p className="mt-1.5 text-xs text-red-600">
                Has alcanzado tu máximo de cafeína de hoy.
              </p>
            )}
          </div>
          <div>
            {profile?.maxDailyCoffees != null ? (
              <ProgressBar
                value={stats.todayDrinks}
                max={profile.maxDailyCoffees}
                label="Bebidas"
              />
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-coffee-600">
                  <CoffeeIcon className="size-4 text-coffee-500" aria-hidden />
                  Bebidas
                </span>
                <span className="font-semibold tabular-nums text-coffee-900">
                  {formatInteger(stats.todayDrinks)}
                </span>
              </div>
            )}
            {profile?.maxDailyCoffees != null && stats.todayDrinks >= profile.maxDailyCoffees && (
              <p className="mt-1.5 text-xs text-red-600">
                Has alcanzado tu máximo recomendado de bebidas de hoy. Quizá toque descafeinado.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<CoffeeIcon className="size-5" aria-hidden />}
          label="Cafeína hoy"
          value={formatMg(stats.todayMg)}
          sub={
            stats.todayDrinks === 0
              ? 'Todavía nada'
              : formatEspressos(espressoEquivalent(stats.todayMg))
          }
        />
        <StatCard
          icon={<Timer className="size-5" aria-hidden />}
          label="Desde la última bebida"
          value={stats.minutesSinceLast !== null ? formatDuration(stats.minutesSinceLast) : '—'}
        />
        <StatCard
          icon={<Gauge className="size-5" aria-hidden />}
          label="Ritmo de consumo"
          value={
            stats.mgPerHourToday !== null ? `${formatInteger(stats.mgPerHourToday)} mg/h` : '—'
          }
          sub="Cafeína por hora hoy"
        />
        <StatCard
          icon={<Hourglass className="size-5" aria-hidden />}
          label="Media entre bebidas"
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
          label="Siguiente bebida"
          value={
            stats.nextCoffeeEstimate
              ? nextIsPast
                ? 'Ya toca'
                : formatTime(stats.nextCoffeeEstimate)
              : '—'
          }
          sub="Según tus patrones"
          tone={nextIsPast ? 'positive' : 'default'}
        />
      </div>

      <Card>
        <CardHeader
          title="Registro de hoy"
          subtitle={`${todayCoffees.length} ${drinkLabel(todayCoffees.length)}`}
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
        title="Eliminar bebida"
        message={
          deleting
            ? `¿Seguro que quieres eliminar la bebida de las ${formatTime(deleting.takenAt)}?`
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
