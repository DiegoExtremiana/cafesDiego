import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, LineChart, LogOut, Trash2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GroupMembersList } from './GroupMembersList';
import { GroupMessages } from './GroupMessages';
import { GroupDailyChartPanel } from './GroupDailyChartPanel';
import { GroupNameSection } from './GroupNameSection';
import { deleteGroup, getGroupDailySeries, leaveGroup } from '@/services/groupService';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';
import type { DailySeriesPoint, Group } from '@/types/group';

/** Vistas navegables al estilo WhatsApp: chat → descripción → gráfico. */
type View = 'chat' | 'info' | 'chart';

interface GroupDetailModalProps {
  open: boolean;
  /** Grupo abierto; null cuando está cerrado (se conserva el último para la salida). */
  group: Group | null;
  currentUserId: string | null;
  onClose: () => void;
  /** Recarga la lista de grupos de la página (roles, expulsiones, salidas, borrado). */
  onChanged: () => void;
}

/**
 * Detalle de un grupo al estilo WhatsApp: abre en el chat; desde su cabecera se
 * accede a la "Descripción del grupo" (miembros por ranking semanal, gráfico y
 * ajustes).
 */
export function GroupDetailModal({
  open,
  group,
  currentUserId,
  onClose,
  onChanged,
}: GroupDetailModalProps) {
  // Conserva el último grupo mientras se reproduce la animación de cierre.
  const lastGroup = useRef<Group | null>(null);
  if (group) lastGroup.current = group;
  const g = group ?? lastGroup.current;
  const groupId = g?.id ?? null;

  const [view, setView] = useState<View>('chat');
  const [series, setSeries] = useState<DailySeriesPoint[] | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Reinicia el estado al abrir un grupo distinto.
  useEffect(() => {
    setView('chat');
    setSeries(null);
    setSeriesError(null);
    setConfirmRemove(false);
    setRemoveError(null);
  }, [groupId]);

  // Carga la serie del gráfico la primera vez que se abre esa vista.
  useEffect(() => {
    if (!open || view !== 'chart' || series !== null || !groupId) return;
    setSeriesError(null);
    getGroupDailySeries(groupId)
      .then(setSeries)
      .catch((err) =>
        setSeriesError(err instanceof Error ? err.message : 'No se pudo cargar la comparativa.'),
      );
  }, [open, view, series, groupId]);

  // Refresca la comparativa al volver a la pestaña si el gráfico está abierto.
  const refetchSeries = useCallback(() => {
    if (view !== 'chart' || !groupId) return;
    getGroupDailySeries(groupId)
      .then(setSeries)
      .catch(() => {});
  }, [view, groupId]);
  useVisibilityRefetch(refetchSeries);

  if (!g) return null;

  const isOwner = g.myRole === 'owner';
  const canSeeSettings = isOwner || g.myRole === 'coadmin';

  const handleRemove = async () => {
    setRemoveError(null);
    try {
      if (isOwner) await deleteGroup(g.id);
      else await leaveGroup(g.id);
      onChanged();
      onClose();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
      setConfirmRemove(false);
    }
  };

  const backButton = (label: string, to: View) => (
    <button
      type="button"
      onClick={() => setView(to)}
      className="-ml-1 inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-sm font-medium text-coffee-500 transition-colors hover:bg-coffee-50 hover:text-coffee-800"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );

  return (
    <Modal open={open} title={g.name} onClose={onClose} size={view === 'chart' ? 'xl' : 'md'}>
      <div className="flex flex-col gap-4">
        {view === 'chat' && (
          <>
            <button
              type="button"
              onClick={() => setView('info')}
              className="flex items-center gap-3 rounded-xl border border-coffee-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-coffee-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coffee-100 text-coffee-600">
                <Users className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-coffee-900">
                  Descripción del grupo
                </span>
                <span className="block truncate text-xs text-coffee-400">
                  {g.memberCount} {g.memberCount === 1 ? 'miembro' : 'miembros'} · miembros, gráfico
                  y ajustes
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-coffee-300" aria-hidden />
            </button>
            <GroupMessages groupId={g.id} currentUserId={currentUserId} />
          </>
        )}

        {view === 'info' && (
          <>
            {backButton('Volver al chat', 'chat')}
            {removeError && <Alert variant="error">{removeError}</Alert>}

            <GroupNameSection group={g} onChanged={onChanged} />

            <section className="flex flex-col gap-2">
              <div>
                <h3 className="text-sm font-semibold text-coffee-900">Miembros</h3>
                <p className="text-xs text-coffee-400">
                  Ranking semanal, de quien menos cafeína bebe a quien más.
                </p>
              </div>
              <GroupMembersList
                group={g}
                currentUserId={currentUserId}
                defaultMetric="week"
                onChanged={onChanged}
              />
            </section>

            <button
              type="button"
              onClick={() => setView('chart')}
              className="flex items-center gap-3 rounded-xl border border-coffee-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-coffee-50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coffee-100 text-coffee-600">
                <LineChart className="size-4.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-coffee-900">Gráfico comparativo</span>
                <span className="block text-xs text-coffee-400">Cafeína por día de cada miembro</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-coffee-300" aria-hidden />
            </button>

            {canSeeSettings && (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-coffee-900">Ajustes</h3>
                {isOwner ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-red-800">Eliminar grupo</p>
                      <p className="text-xs text-red-600/90">
                        Se eliminará «{g.name}» para todos sus miembros. Esta acción no se puede
                        deshacer.
                      </p>
                    </div>
                    <div>
                      <Button variant="danger" size="sm" onClick={() => setConfirmRemove(true)}>
                        <Trash2 className="size-4" aria-hidden />
                        Eliminar grupo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-coffee-200 bg-coffee-50/60 p-4">
                    <p className="text-sm font-medium text-coffee-800">Eres co-administrador</p>
                    <p className="text-xs text-coffee-500">
                      Puedes gestionar y expulsar miembros desde la lista de arriba. Solo el creador
                      del grupo puede eliminarlo.
                    </p>
                  </div>
                )}
              </section>
            )}

            {!isOwner && (
              <div className="flex justify-end border-t border-coffee-100 pt-3">
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
                  <LogOut className="size-4" aria-hidden />
                  Salir del grupo
                </Button>
              </div>
            )}
          </>
        )}

        {view === 'chart' && (
          <>
            {backButton('Volver a la descripción', 'info')}
            {seriesError ? (
              <Alert variant="error">{seriesError}</Alert>
            ) : series === null ? (
              <Spinner label="Cargando comparativa…" />
            ) : (
              <>
                <p className="text-xs text-coffee-400">
                  Cafeína (mg) por día de cada miembro. Tu línea aparece resaltada.
                </p>
                <GroupDailyChartPanel points={series} currentUserId={currentUserId} />
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title={isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
        message={
          isOwner
            ? `Se eliminará «${g.name}» para todos sus miembros. Esta acción no se puede deshacer.`
            : `Vas a salir de «${g.name}». Podrás volver si te invitan de nuevo.`
        }
        confirmLabel={isOwner ? 'Eliminar' : 'Salir'}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </Modal>
  );
}
