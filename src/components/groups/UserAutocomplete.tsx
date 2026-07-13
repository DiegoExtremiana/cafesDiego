import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { searchUsers } from '@/services/groupService';
import type { UserSearchResult } from '@/types/group';

interface UserAutocompleteProps {
  /** Se llama al elegir un usuario de las sugerencias. */
  onSelect: (user: UserSearchResult) => void;
  /** Ids a ocultar de las sugerencias (ya seleccionados). */
  excludeIds?: string[];
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Campo de texto con sugerencias de usuarios a medida que se escribe. */
export function UserAutocomplete({
  onSelect,
  excludeIds = [],
  label,
  placeholder = 'Buscar usuario…',
  autoFocus,
}: UserAutocompleteProps) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      let cancelled = false;
      searchUsers(q)
        .then((users) => {
          if (!cancelled) {
            setResults(users);
            setActive(0);
          }
        })
        .catch(() => {
          if (!cancelled) setResults([]);
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

  const visible = results.filter((user) => !excludeIds.includes(user.id));

  const choose = (user: UserSearchResult) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-coffee-800">
          {label}
        </label>
      )}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-coffee-300"
          aria-hidden
        />
        <input
          id={inputId}
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!open || visible.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((index) => (index + 1) % visible.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => (index - 1 + visible.length) % visible.length);
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const picked = visible[active];
              if (picked) choose(picked);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-coffee-200 bg-white py-2.5 pl-9 pr-9 text-base text-coffee-950 placeholder:text-coffee-300 transition-shadow focus:border-coffee-400 focus:shadow-[0_0_0_3px_rgba(156,111,68,0.15)] focus:outline-none"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-coffee-300"
            aria-hidden
          />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-coffee-200 bg-white py-1 shadow-lg">
          {visible.length === 0 ? (
            <p className="px-3 py-2 text-sm text-coffee-400">
              {loading ? 'Buscando…' : 'Sin resultados'}
            </p>
          ) : (
            visible.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(user)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                  index === active ? 'bg-coffee-50' : 'hover:bg-coffee-50'
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coffee-100 text-xs font-bold uppercase text-coffee-600">
                  {(user.displayName || user.username).slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-coffee-900">
                    {user.displayName || user.username}
                  </span>
                  <span className="block truncate text-xs text-coffee-400">@{user.username}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
