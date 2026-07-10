import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Crown, LineChart, LogOut, Trash2, Trophy, UserPlus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GroupComparisonChart } from './GroupComparisonChart';
import {
  deleteGroup,
  getGroupRanking,
  getGroupWeeklySeries,
  inviteToGroup,
  leaveGroup,
} from '@/services/groupService';
import { formatEspressos, formatInteger, formatMg } from '@/utils/format';
import { espressoEquivalent } from '@/types/coffee';
import type { Group, RankingEntry, WeeklySeriesPoint } from '@/types/group';

type Metric = 'today' | 'week' | 'total';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'total', label: 'Total' },
];

const medalColor = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

interface GroupCardProps {
  group: Group;
  currentUserId: string | null;
  /** Se llama tras salir/eliminar para que la página recargue la lista. */
  onChanged: () => void;
}

export function GroupCard({ group, currentUserId, onChanged }: GroupCardProps) {
  const isOwner = group.ownerId === currentUserId;
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('today');

  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [series, setSeries] = useState<WeeklySeriesPoint[] | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  const reloadId = useRef(0);

  const loadRanking = () => {
    const id = ++reloadId.current;
    getGroupRanking(group.id)
      .then((rows) => {
        if (reloadId.current === id) setRanking(rows);
      })
      .catch((err) => {
        if (reloadId.current === id) setError(err instanceof Error ? err.message : 'Error al cargar el ranking.');
      });
  };

  useEffect(() => {
    loadRanking();
    return () => {
      reloadId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  const mgOf = (entry: RankingEntry): number =>
    metric === 'today' ? entry.todayMg : metric === 'week' ? entry.weekMg : entry.totalMg;
  const drinksOf = (entry: RankingEntry): number =>
    metric === 'today'
      ? entry.todayDrinks
      : metric === 'week'
        ? entry.weekDrinks
        : entry.totalDrinks;

  const sorted = ranking ? [...ranking].sort((a, b) => mgOf(b) - mgOf(a)) : [];

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    const username = inviteUsername.trim();
    if (!username) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await inviteToGroup(group.id, username);
      setInviteMsg({ tone: 'ok', text: `Invitación enviada a @${username.toLowerCase()}.` });
      setInviteUsername('');
    } catch (err) {
      setInviteMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo invitar.' });
    } finally {
      setInviting(false);
    }
  };

  const openComparison = () => {
    setComparisonOpen(true);
    if (series === null) {
      setSeriesError(null);
      getGroupWeeklySeries(group.id)
        .then(setSeries)
        .catch((err) =>
          setSeriesError(err instanceof Error ? err.message : 'No se pudo cargar la comparativa.'),
        );
    }
  };

  const handleRemove = async () => {
    try {
      if (isOwner) await deleteGroup(group.id);
      else await leaveGroup(group.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
      setConfirmingRemove(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={group.name}
        subtitle={`${group.memberCount} ${group.memberCount === 1 ? 'miembro' : 'miembros'}`}
        icon={<Trophy className="size-4" aria-hidden />}
        actions={
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            aria-label={isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
            title={isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
            className="rounded-lg p-1.5 text-coffee-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            {isOwner ? <Trash2 className="size-4" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
          </button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-coffee-200 bg-white p-0.5">
          {METRICS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              aria-pressed={metric === key}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                metric === key ? 'bg-coffee-600 text-white' : 'text-coffee-500 hover:bg-coffee-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={openComparison}>
          <LineChart className="size-3.5" aria-hidden />
          Comparativa
        </Button>
      </div>

      {ranking === null ? (
        <Spinner label="Cargando ranking..." />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-coffee-400">Aún no hay datos que mostrar.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {sorted.map((entry, index) => {
            const isMe = entry.userId === currentUserId;
            const mg = mgOf(entry);
            return (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  isMe ? 'bg-coffee-50 ring-1 ring-coffee-200' : ''
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center text-sm font-bold tabular-nums ${
                    index < 3 ? medalColor[index] : 'text-coffee-400'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-coffee-900">
                    {entry.displayName || entry.username}
                    {entry.userId === group.ownerId && (
                      <Crown className="size-3.5 shrink-0 text-amber-500" aria-hidden />
                    )}
                    {isMe && <span className="text-xs font-normal text-coffee-400">(tú)</span>}
                  </p>
                  <p className="truncate text-xs text-coffee-400">
                    {formatInteger(drinksOf(entry))} bebidas · {formatEspressos(espressoEquivalent(mg))}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-coffee-800">
                  {formatMg(mg)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <form onSubmit={handleInvite} className="flex flex-col gap-2 border-t border-coffee-100 pt-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Invitar a un amigo"
              value={inviteUsername}
              onChange={(event) => setInviteUsername(event.target.value)}
              placeholder="nombre de usuario"
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="secondary" loading={inviting} disabled={!inviteUsername.trim()}>
            <UserPlus className="size-4" aria-hidden />
            Invitar
          </Button>
        </div>
        {inviteMsg && (
          <p className={`text-xs ${inviteMsg.tone === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
            {inviteMsg.text}
          </p>
        )}
      </form>

      <Modal
        open={comparisonOpen}
        title={`${group.name} · evolución semanal`}
        onClose={() => setComparisonOpen(false)}
        size="xl"
      >
        {seriesError ? (
          <Alert variant="error">{seriesError}</Alert>
        ) : series === null ? (
          <Spinner label="Cargando comparativa..." />
        ) : (
          <>
            <p className="mb-3 text-xs text-coffee-400">
              Cafeína (mg) por semana de cada miembro. Tu línea aparece resaltada.
            </p>
            <div className="-mx-2 overflow-x-auto px-2">
              <div style={{ minWidth: Math.max(560, new Set(series.map((p) => p.weekStart)).size * 44) }}>
                <GroupComparisonChart points={series} currentUserId={currentUserId} />
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmingRemove}
        title={isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
        message={
          isOwner
            ? `Se eliminará "${group.name}" para todos sus miembros. Esta acción no se puede deshacer.`
            : `Vas a salir de "${group.name}". Podrás volver si te invitan de nuevo.`
        }
        confirmLabel={isOwner ? 'Eliminar' : 'Salir'}
        onConfirm={handleRemove}
        onCancel={() => setConfirmingRemove(false)}
      />
    </Card>
  );
}
