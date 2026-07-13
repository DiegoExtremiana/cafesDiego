import { useEffect, useRef, useState } from 'react';
import { Crown, ShieldCheck, ShieldMinus, ShieldPlus, Trophy, UserMinus } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getGroupRanking, kickMember, setMemberRole } from '@/services/groupService';
import { formatEspressos, formatInteger, formatMg } from '@/utils/format';
import { espressoEquivalent } from '@/types/coffee';
import type { Group, GroupRole, RankingEntry } from '@/types/group';

type Metric = 'today' | 'week' | 'total';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'total', label: 'Total' },
];

interface GroupMembersListProps {
  group: Group;
  currentUserId: string | null;
  /** Métrica inicial del ranking (por defecto 'total'). */
  defaultMetric?: Metric;
  /** Se llama cuando cambia la composición o los roles (para recargar la lista). */
  onChanged: () => void;
}

/**
 * Sección "Usuarios": miembros ordenados de MENOS a MÁS cafeína (quien menos
 * bebe es el nº 1). El creador y los co-admins pueden gestionar a los demás.
 */
export function GroupMembersList({
  group,
  currentUserId,
  defaultMetric = 'total',
  onChanged,
}: GroupMembersListProps) {
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmKick, setConfirmKick] = useState<RankingEntry | null>(null);
  const reloadId = useRef(0);

  const canModerate = group.myRole === 'owner' || group.myRole === 'coadmin';

  const load = () => {
    const id = ++reloadId.current;
    getGroupRanking(group.id)
      .then((rows) => {
        if (reloadId.current === id) setRanking(rows);
      })
      .catch((err) => {
        if (reloadId.current === id) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el ranking.');
        }
      });
  };

  useEffect(() => {
    load();
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

  // Orden ascendente: quien menos cafeína consume aparece primero.
  const sorted = ranking ? [...ranking].sort((a, b) => mgOf(a) - mgOf(b)) : [];

  const canActOn = (entry: RankingEntry): boolean => {
    if (!canModerate) return false;
    if (entry.userId === currentUserId) return false;
    if (entry.role === 'owner') return false;
    if (group.myRole === 'owner') return true;
    return entry.role === 'member'; // un co-admin solo gestiona a miembros normales
  };

  const changeRole = async (entry: RankingEntry, role: 'coadmin' | 'member') => {
    setBusy(true);
    setError(null);
    try {
      await setMemberRole(group.id, entry.userId, role);
      setSelectedId(null);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol.');
    } finally {
      setBusy(false);
    }
  };

  const doKick = async (entry: RankingEntry) => {
    setBusy(true);
    setError(null);
    try {
      await kickMember(group.id, entry.userId);
      setConfirmKick(null);
      setSelectedId(null);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo expulsar al miembro.');
      setConfirmKick(null);
    } finally {
      setBusy(false);
    }
  };

  const roleBadge = (role: GroupRole) => {
    if (role === 'owner') {
      return <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Creador" />;
    }
    if (role === 'coadmin') {
      return <ShieldCheck className="size-3.5 shrink-0 text-coffee-500" aria-label="Co-administrador" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-coffee-400">De quien menos bebe a quien más.</p>
        <div className="inline-flex rounded-xl border border-coffee-200 bg-white p-0.5">
          {METRICS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              aria-pressed={metric === key}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                metric === key ? 'bg-coffee-600 text-white' : 'text-coffee-500 hover:bg-coffee-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {ranking === null ? (
        <Spinner label="Cargando miembros…" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-coffee-400">Aún no hay datos que mostrar.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {sorted.map((entry, index) => {
            const isMe = entry.userId === currentUserId;
            const mg = mgOf(entry);
            const actionable = canActOn(entry);
            const isSelected = selectedId === entry.userId;
            return (
              <li key={entry.userId} className="flex flex-col">
                <button
                  type="button"
                  disabled={!actionable}
                  onClick={() => actionable && setSelectedId(isSelected ? null : entry.userId)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    isMe ? 'bg-coffee-50 ring-1 ring-coffee-200' : ''
                  } ${actionable ? 'cursor-pointer hover:bg-coffee-100/70' : 'cursor-default'} ${
                    isSelected ? 'bg-coffee-100' : ''
                  }`}
                >
                  <span
                    className={`w-6 shrink-0 text-center text-sm font-bold tabular-nums ${
                      index === 0 ? 'text-emerald-600' : 'text-coffee-400'
                    }`}
                  >
                    {index === 0 ? <Trophy className="mx-auto size-4" aria-hidden /> : index + 1}
                  </span>
                  <Avatar
                    user={{
                      displayName: entry.displayName,
                      username: entry.username,
                      avatarUrl: entry.avatarUrl,
                    }}
                    className="size-8 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-coffee-900">
                      {entry.displayName || entry.username}
                      {roleBadge(entry.role)}
                      {isMe && <span className="text-xs font-normal text-coffee-400">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-coffee-400">
                      {formatInteger(drinksOf(entry))} bebidas · {formatEspressos(espressoEquivalent(mg))}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-coffee-800">
                    {formatMg(mg)}
                  </span>
                </button>

                {isSelected && actionable && (
                  <div className="ml-9 mt-1 flex flex-wrap gap-2 rounded-xl border border-coffee-100 bg-white p-2 animate-fade-in">
                    {group.myRole === 'owner' &&
                      (entry.role === 'coadmin' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => changeRole(entry, 'member')}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-coffee-700 transition-colors hover:bg-coffee-50 disabled:opacity-60"
                        >
                          <ShieldMinus className="size-3.5" aria-hidden />
                          Quitar co-admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => changeRole(entry, 'coadmin')}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-coffee-700 transition-colors hover:bg-coffee-50 disabled:opacity-60"
                        >
                          <ShieldPlus className="size-3.5" aria-hidden />
                          Nombrar co-admin
                        </button>
                      ))}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmKick(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <UserMinus className="size-3.5" aria-hidden />
                      Expulsar del grupo
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <ConfirmDialog
        open={confirmKick !== null}
        title="Expulsar del grupo"
        message={
          confirmKick
            ? `Vas a expulsar a ${confirmKick.displayName || confirmKick.username} del grupo. Podrás volver a invitarle más adelante.`
            : ''
        }
        confirmLabel="Expulsar"
        onConfirm={() => confirmKick && doKick(confirmKick)}
        onCancel={() => setConfirmKick(null)}
      />
    </div>
  );
}
