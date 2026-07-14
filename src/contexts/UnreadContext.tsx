import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getGroupUnreadCounts, markGroupRead } from '@/services/groupService';
import { useAuth } from '@/hooks/useAuth';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';

export interface UnreadContextValue {
  /** Mensajes sin leer por grupo: { groupId: nº }. */
  counts: Record<string, number>;
  /** Total de mensajes sin leer sumando todos los grupos. */
  total: number;
  /** Vuelve a pedir los recuentos al servidor. */
  refresh: () => void;
  /** Marca un grupo como leído (optimista + persistente). */
  markRead: (groupId: string) => void;
}

const POLL_MS = 10_000;

// eslint-disable-next-line react-refresh/only-export-components
export const UnreadContext = createContext<UnreadContextValue | null>(null);

/**
 * Estado compartido de mensajes de grupo sin leer. Sondea el servidor cada
 * pocos segundos y al recuperar el foco (los grupos usan RLS solo-RPC, así que
 * no hay realtime de otros usuarios). Lo consumen la cabecera (total) y la lista
 * de grupos (por grupo); el detalle del grupo marca como leído al abrir el chat.
 */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(() => {
    if (!user) {
      setCounts({});
      return;
    }
    getGroupUnreadCounts()
      .then(setCounts)
      .catch(() => {});
  }, [user]);

  // Carga inicial y sondeo periódico mientras haya sesión.
  useEffect(() => {
    refresh();
    if (!user) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [user, refresh]);

  useVisibilityRefetch(refresh);

  const markRead = useCallback(
    (groupId: string) => {
      // Baja el contador del grupo a 0 al instante; el servidor confirma luego.
      setCounts((current) => (current[groupId] ? { ...current, [groupId]: 0 } : current));
      markGroupRead(groupId)
        .then(refresh)
        .catch(() => {});
    },
    [refresh],
  );

  const total = useMemo(() => Object.values(counts).reduce((sum, n) => sum + n, 0), [counts]);

  const value = useMemo(
    () => ({ counts, total, refresh, markRead }),
    [counts, total, refresh, markRead],
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}
