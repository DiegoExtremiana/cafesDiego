import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { inviteToGroup } from '@/services/groupService';
import type { Group, UserSearchResult } from '@/types/group';

type InviteState = { status: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

interface UserActionsModalProps {
  open: boolean;
  /** Usuario seleccionado; null cuando está cerrado (se conserva para la salida). */
  user: UserSearchResult | null;
  /** Grupos del usuario actual a los que puede invitar. */
  myGroups: Group[];
  onClose: () => void;
}

/** Menú de acciones sobre un usuario encontrado: ver perfil o invitarle a un grupo. */
export function UserActionsModal({ open, user, myGroups, onClose }: UserActionsModalProps) {
  const lastUser = useRef<UserSearchResult | null>(null);
  if (user) lastUser.current = user;
  const u = user ?? lastUser.current;

  const [states, setStates] = useState<Record<string, InviteState>>({});

  // Reinicia el estado de invitaciones al cambiar de usuario.
  useEffect(() => {
    setStates({});
  }, [u?.id]);

  const invite = async (group: Group) => {
    if (!u) return;
    setStates((current) => ({ ...current, [group.id]: { status: 'loading' } }));
    try {
      await inviteToGroup(group.id, u.username);
      setStates((current) => ({ ...current, [group.id]: { status: 'ok' } }));
    } catch (err) {
      setStates((current) => ({
        ...current,
        [group.id]: {
          status: 'error',
          message: err instanceof Error ? err.message : 'No se pudo invitar.',
        },
      }));
    }
  };

  if (!u) return null;

  return (
    <Modal open={open} title={u.displayName || u.username} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-coffee-100 text-base font-bold uppercase text-coffee-600">
            {(u.displayName || u.username).slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-coffee-900">
              {u.displayName || u.username}
            </p>
            <p className="truncate text-xs text-coffee-400">@{u.username}</p>
          </div>
        </div>

        {u.isPublic ? (
          <Link
            to={`/u/${u.username}`}
            onClick={onClose}
            className="flex items-center justify-between rounded-xl border border-coffee-200 bg-white px-3.5 py-2.5 text-sm font-medium text-coffee-800 transition-colors hover:bg-coffee-50"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="size-4 text-coffee-400" aria-hidden />
              Ver perfil público
            </span>
          </Link>
        ) : (
          <p className="rounded-xl border border-coffee-100 bg-coffee-50/60 px-3.5 py-2.5 text-xs text-coffee-400">
            Este usuario no tiene el perfil público.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-coffee-800">Invitar a un grupo</p>
          {myGroups.length === 0 ? (
            <p className="text-xs text-coffee-400">Todavía no tienes grupos a los que invitar.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {myGroups.map((group) => {
                const state = states[group.id] ?? { status: 'idle' };
                return (
                  <li
                    key={group.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-coffee-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-coffee-900">{group.name}</p>
                      {state.status === 'error' && (
                        <p className="truncate text-xs text-red-600">{state.message}</p>
                      )}
                    </div>
                    {state.status === 'ok' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check className="size-3.5" aria-hidden />
                        Invitado
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={state.status === 'loading'}
                        onClick={() => invite(group)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-coffee-200 bg-white px-2.5 py-1.5 text-xs font-medium text-coffee-700 transition-colors hover:bg-coffee-50 disabled:opacity-60"
                      >
                        <UserPlus className="size-3.5" aria-hidden />
                        {state.status === 'loading' ? 'Invitando…' : 'Invitar'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
