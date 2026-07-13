import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Search, Trophy } from 'lucide-react';
import { searchUsers } from '@/services/groupService';
import { UserActionsModal } from './UserActionsModal';
import type { Group, UserSearchResult } from '@/types/group';

interface GroupSearchBarProps {
  myGroups: Group[];
  onOpenGroup: (group: Group) => void;
  onCreateClick: () => void;
}

/** Buscador combinado de grupos (los tuyos) y usuarios, con el botón de crear. */
export function GroupSearchBar({ myGroups, onOpenGroup, onCreateClick }: GroupSearchBarProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();
  const matchedGroups = trimmed
    ? myGroups.filter((group) => group.name.toLowerCase().includes(trimmed))
    : [];

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      let cancelled = false;
      searchUsers(q)
        .then((rows) => {
          if (!cancelled) setUsers(rows);
        })
        .catch(() => {
          if (!cancelled) setUsers([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openGroup = (group: Group) => {
    setOpen(false);
    setQuery('');
    onOpenGroup(group);
  };

  const openUser = (user: UserSearchResult) => {
    setOpen(false);
    setQuery('');
    setSelectedUser(user);
  };

  const showDropdown = open && trimmed.length > 0;
  const nothing = showDropdown && !loading && matchedGroups.length === 0 && users.length === 0;

  return (
    <>
      <div className="flex items-stretch gap-2">
        <div ref={containerRef} className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-coffee-300"
            aria-hidden
          />
          <input
            value={query}
            autoComplete="off"
            placeholder="Buscar grupos y usuarios…"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-xl border border-coffee-200 bg-white py-2.5 pl-10 pr-9 text-base text-coffee-950 placeholder:text-coffee-300 transition-shadow focus:border-coffee-400 focus:shadow-[0_0_0_3px_rgba(156,111,68,0.15)] focus:outline-none"
          />
          {loading && (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-coffee-300"
              aria-hidden
            />
          )}

          {showDropdown && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-coffee-200 bg-white py-1 shadow-lg">
              {nothing && <p className="px-3 py-2 text-sm text-coffee-400">Sin resultados</p>}

              {matchedGroups.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-coffee-400">
                    Grupos
                  </p>
                  {matchedGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => openGroup(group)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-coffee-50"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600">
                        <Trophy className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-coffee-900">
                          {group.name}
                        </span>
                        <span className="block truncate text-xs text-coffee-400">
                          {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'} · tu
                          puesto {group.myRank > 0 ? `${group.myRank}.º` : '—'}
                        </span>
                      </span>
                    </button>
                  ))}
                </>
              )}

              {users.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-coffee-400">
                    Usuarios
                  </p>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => openUser(user)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-coffee-50"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coffee-100 text-xs font-bold uppercase text-coffee-600">
                        {(user.displayName || user.username).slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-coffee-900">
                          {user.displayName || user.username}
                        </span>
                        <span className="block truncate text-xs text-coffee-400">@{user.username}</span>
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Crear un grupo"
          title="Crear un grupo"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-coffee-600 text-white shadow-sm transition-colors hover:bg-coffee-700 active:bg-coffee-800"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>

      <UserActionsModal
        open={selectedUser !== null}
        user={selectedUser}
        myGroups={myGroups}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
}
