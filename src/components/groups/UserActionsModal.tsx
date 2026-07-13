import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { inviteToGroup } from '@/services/groupService';
import type { Group, UserSearchResult } from '@/types/group';

type InviteState = { status: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

interface UserActionsModalProps {
  user: UserSearchResult;
  /** Grupos del usuario actual a los que puede invitar. */
  myGroups: Group[];
  onClose: () => void;
}

/** Menú de acciones sobre un usuario encontrado: ver perfil o invitarle a un grupo. */
export function UserActionsModal({ user, myGroups, onClose }: UserActionsModalProps) {
  const [states, setStates] = useState<Record<string, InviteState>>({});

  const invite = async (group: Group) => {
    setStates((current) => ({ ...current, [group.id]: { status: 'loading' } }));
    try {
      await inviteToGroup(group.id, user.username);
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

  return (
    <Modal open title={user.displayName || user.username} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-coffee-100 text-base font-bold uppercase text-coffee-600">
            {(user.displayName || user.username).slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-coffee-900">
              {user.displayName || user.username}
            </p>
            <p className="truncate text-xs text-coffee-400">@{user.username}</p>
          </div>
        </div>

        {user.isPublic ? (
          <Link
            to={`/u/${user.username}`}
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
