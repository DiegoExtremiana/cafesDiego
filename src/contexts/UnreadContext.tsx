import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getGroupUnreadCounts, markGroupRead } from '@/services/groupService';
import { useAuth } from '@/hooks/useAuth';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';

/** Manejador de eventos en tiempo real de un grupo. */
export type GroupEventHandler = (kind: string, payload: Record<string, unknown>) => void;

export interface UnreadContextValue {
  /** Mensajes sin leer por grupo: { groupId: nº }. */
  counts: Record<string, number>;
  /** Total de mensajes sin leer sumando todos los grupos. */
  total: number;
  /** Vuelve a pedir los recuentos al servidor. */
  refresh: () => void;
  /** Marca un grupo como leído (optimista + persistente). */
  markRead: (groupId: string) => void;
  /**
   * Escucha eventos de broadcast de un grupo ('*' = cualquiera). El handler
   * recibe (kind, payload). Devuelve una función para darse de baja.
   */
  subscribeGroup: (groupId: string, handler: GroupEventHandler) => () => void;
}

// Respaldo lento: el tiempo real es la vía principal; el sondeo solo cubre
// caídas de la conexión de Realtime o falta de configuración.
const POLL_MS = 45_000;

// eslint-disable-next-line react-refresh/only-export-components
export const UnreadContext = createContext<UnreadContextValue | null>(null);

/**
 * Centro de tiempo real de los grupos + estado de mensajes sin leer. Se suscribe
 * a un canal privado de broadcast por cada grupo del usuario ('group-<id>') y
 * reparte los eventos a los componentes vía subscribeGroup; además mantiene los
 * contadores de no leídos (para la cabecera y la lista) refrescándolos al llegar
 * un mensaje. El sondeo lento y el refetch al enfocar quedan como respaldo.
 */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const accessToken = session?.access_token ?? null;
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

  // Carga inicial + sondeo lento de respaldo mientras haya sesión.
  useEffect(() => {
    refresh();
    if (!user) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [user, refresh]);

  useVisibilityRefetch(refresh);

  const markRead = useCallback(
    (groupId: string) => {
      setCounts((current) => (current[groupId] ? { ...current, [groupId]: 0 } : current));
      markGroupRead(groupId)
        .then(refresh)
        .catch(() => {});
    },
    [refresh],
  );

  // ---- Registro de manejadores por grupo ('*' = comodín para cualquiera) ----
  const handlersRef = useRef<Map<string, Set<GroupEventHandler>>>(new Map());
  const subscribeGroup = useCallback((groupId: string, handler: GroupEventHandler) => {
    const map = handlersRef.current;
    let set = map.get(groupId);
    if (!set) {
      set = new Set();
      map.set(groupId, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
      if (set.size === 0) map.delete(groupId);
    };
  }, []);

  // ---- Canales de broadcast privados, uno por cada grupo del usuario ----
  // Los ids salen de los recuentos (una fila por grupo, aunque tenga 0).
  const idsKey = useMemo(() => Object.keys(counts).sort().join(','), [counts]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!user || !accessToken) return;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let cancelled = false;
    const channels: RealtimeChannel[] = [];

    (async () => {
      // Autoriza los canales privados con el token de la sesión.
      await supabase.realtime.setAuth(accessToken);
      if (cancelled) return;
      for (const gid of ids) {
        const channel = supabase
          .channel(`group-${gid}`, { config: { private: true } })
          .on('broadcast', { event: 'change' }, (msg) => {
            const payload = (msg.payload ?? {}) as Record<string, unknown>;
            const kind = String(payload.kind ?? '');
            // Un mensaje nuevo puede cambiar el nº de no leídos.
            if (kind === 'message') refreshRef.current();
            const map = handlersRef.current;
            map.get(gid)?.forEach((handler) => handler(kind, payload));
            map.get('*')?.forEach((handler) => handler(kind, payload));
          })
          .subscribe();
        channels.push(channel);
      }
    })();

    return () => {
      cancelled = true;
      channels.forEach((channel) => void supabase.removeChannel(channel));
    };
  }, [user, accessToken, idsKey]);

  const total = useMemo(() => Object.values(counts).reduce((sum, n) => sum + n, 0), [counts]);

  const value = useMemo(
    () => ({ counts, total, refresh, markRead, subscribeGroup }),
    [counts, total, refresh, markRead, subscribeGroup],
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}
