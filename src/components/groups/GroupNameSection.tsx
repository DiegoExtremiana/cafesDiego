import { useCallback, useEffect, useState } from 'react';
import { Check, Clock, Pencil, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import {
  getMyPendingNameRequest,
  listGroupNameRequests,
  proposeGroupName,
  renameGroup,
  respondGroupNameRequest,
} from '@/services/groupService';
import type { Group, GroupNameRequest } from '@/types/group';

interface GroupNameSectionProps {
  group: Group;
  /** Recarga la lista de grupos de la página (el nombre puede haber cambiado). */
  onChanged: () => void;
}

/**
 * Nombre del grupo, editable al pulsarlo. El creador y los co-administradores lo
 * cambian al instante; un miembro normal lo propone y queda pendiente hasta que
 * un administrador lo aprueba. Los administradores ven aquí las solicitudes.
 */
export function GroupNameSection({ group, onChanged }: GroupNameSectionProps) {
  const isAdmin = group.myRole === 'owner' || group.myRole === 'coadmin';

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(group.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myPending, setMyPending] = useState<string | null>(null);
  const [requests, setRequests] = useState<GroupNameRequest[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    listGroupNameRequests(group.id)
      .then(setRequests)
      .catch(() => {});
  }, [group.id]);

  // Al abrir un grupo distinto: cierra el editor y carga el estado que toque.
  useEffect(() => {
    setEditing(false);
    setValue(group.name);
    setError(null);
    setMyPending(null);
    setRequests([]);
    if (isAdmin) {
      loadRequests();
    } else {
      getMyPendingNameRequest(group.id)
        .then(setMyPending)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  const startEditing = () => {
    setValue(myPending ?? group.name);
    setError(null);
    setEditing(true);
  };

  const submit = async () => {
    const nm = value.trim();
    if (!nm || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (isAdmin) {
        await renameGroup(group.id, nm);
        onChanged();
      } else {
        await proposeGroupName(group.id, nm);
        setMyPending(nm);
      }
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre.');
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (id: string, approve: boolean) => {
    setResolvingId(id);
    setError(null);
    try {
      await respondGroupNameRequest(id, approve);
      loadRequests();
      if (approve) onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resolver la solicitud.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-coffee-400">Nombre del grupo</p>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
            maxLength={40}
            autoFocus
            aria-label="Nombre del grupo"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={submit}
              loading={saving}
              disabled={!value.trim() || value.trim() === group.name}
            >
              <Check className="size-3.5" aria-hidden />
              {isAdmin ? 'Guardar' : 'Proponer'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
          {!isAdmin && (
            <p className="text-xs text-coffee-400">
              Tu propuesta tendrá que aprobarla el creador o un co-administrador.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="group flex items-center gap-2 self-start rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-coffee-50"
          title="Cambiar el nombre del grupo"
        >
          <span className="text-lg font-semibold text-coffee-900">{group.name}</span>
          <Pencil
            className="size-3.5 shrink-0 text-coffee-400 opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </button>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {!isAdmin && myPending && myPending !== group.name && (
        <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Has propuesto «{myPending}». Pendiente de aprobación.
        </p>
      )}

      {isAdmin && requests.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-coffee-200 bg-coffee-50/60 p-3">
          <p className="text-xs font-semibold text-coffee-800">
            Solicitudes de cambio de nombre ({requests.length})
          </p>
          <ul className="flex flex-col gap-2">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-2">
                <Avatar
                  user={{
                    displayName: request.displayName,
                    username: request.username,
                    avatarUrl: request.avatarUrl,
                  }}
                  className="size-7 text-xs"
                  zoomable={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-coffee-900">
                    <span className="font-semibold">«{request.proposedName}»</span>
                  </p>
                  <p className="truncate text-xs text-coffee-400">
                    Propuesto por {request.displayName || request.username}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => resolve(request.id, true)}
                    loading={resolvingId === request.id}
                  >
                    <Check className="size-3.5" aria-hidden />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => resolve(request.id, false)}
                    disabled={resolvingId === request.id}
                  >
                    <X className="size-3.5" aria-hidden />
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
