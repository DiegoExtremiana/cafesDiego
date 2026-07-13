import { useEffect, useRef, useState } from 'react';
import { LineChart, LogOut, MessageSquare, Settings, Trash2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GroupMembersList } from './GroupMembersList';
import { GroupMessages } from './GroupMessages';
import { GroupDailyChartPanel } from './GroupDailyChartPanel';
import { deleteGroup, getGroupDailySeries, leaveGroup } from '@/services/groupService';
import type { DailySeriesPoint, Group } from '@/types/group';

type Section = 'usuarios' | 'grafico' | 'mensajes' | 'ajustes';

interface GroupDetailModalProps {
  open: boolean;
  /** Grupo abierto; null cuando está cerrado (se conserva el último para la salida). */
  group: Group | null;
  currentUserId: string | null;
  onClose: () => void;
  /** Recarga la lista de grupos de la página (roles, expulsiones, salidas, borrado). */
  onChanged: () => void;
}

/** Modal de detalle de un grupo, con secciones navegables. */
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

  const [section, setSection] = useState<Section>('usuarios');
  const [series, setSeries] = useState<DailySeriesPoint[] | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Reinicia el estado al abrir un grupo distinto.
  useEffect(() => {
    setSection('usuarios');
    setSeries(null);
    setSeriesError(null);
    setConfirmRemove(false);
    setRemoveError(null);
  }, [groupId]);

  useEffect(() => {
    if (!open || section !== 'grafico' || series !== null || !groupId) return;
    setSeriesError(null);
    getGroupDailySeries(groupId)
      .then(setSeries)
      .catch((err) =>
        setSeriesError(err instanceof Error ? err.message : 'No se pudo cargar la comparativa.'),
      );
  }, [open, section, series, groupId]);

  if (!g) return null;

  const isOwner = g.myRole === 'owner';
  const canSeeSettings = isOwner || g.myRole === 'coadmin';

  const tabs: { key: Section; label: string; icon: typeof Users }[] = [
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'grafico', label: 'Gráfico', icon: LineChart },
    { key: 'mensajes', label: 'Mensajes', icon: MessageSquare },
    ...(canSeeSettings ? [{ key: 'ajustes' as const, label: 'Ajustes', icon: Settings }] : []),
  ];

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

  return (
    <Modal open={open} title={g.name} onClose={onClose} size="xl">
      <div className="flex flex-col gap-4">
        <nav
          className="flex gap-1 overflow-x-auto rounded-xl border border-coffee-200 bg-white p-1"
          aria-label="Secciones del grupo"
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              aria-pressed={section === key}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                section === key ? 'bg-coffee-600 text-white' : 'text-coffee-500 hover:bg-coffee-50'
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        {removeError && <Alert variant="error">{removeError}</Alert>}

        {section === 'usuarios' && (
          <GroupMembersList group={g} currentUserId={currentUserId} onChanged={onChanged} />
        )}

        {section === 'grafico' && (
          <div>
            {seriesError ? (
              <Alert variant="error">{seriesError}</Alert>
            ) : series === null ? (
              <Spinner label="Cargando comparativa…" />
            ) : (
              <>
                <p className="mb-3 text-xs text-coffee-400">
                  Cafeína (mg) por día de cada miembro. Tu línea aparece resaltada.
                </p>
                <GroupDailyChartPanel points={series} currentUserId={currentUserId} />
              </>
            )}
          </div>
        )}

        {section === 'mensajes' && (
          <GroupMessages groupId={g.id} currentUserId={currentUserId} />
        )}

        {section === 'ajustes' && (
          <div className="flex flex-col gap-3">
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
                  Puedes gestionar y expulsar miembros desde la sección «Usuarios». Solo el creador
                  del grupo puede eliminarlo.
                </p>
              </div>
            )}
          </div>
        )}

        {!isOwner && (
          <div className="flex justify-end border-t border-coffee-100 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
              <LogOut className="size-4" aria-hidden />
              Salir del grupo
            </Button>
          </div>
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
