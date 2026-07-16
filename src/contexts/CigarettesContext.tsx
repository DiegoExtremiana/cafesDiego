import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as cigaretteService from '@/services/cigaretteService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Cigarette } from '@/types/cigarette';
import type { CigaretteRow } from '@/types/database';

export interface CigarettesContextValue {
  /** Todos los cigarros del usuario, en orden cronológico ascendente. */
  cigarettes: Cigarette[];
  loading: boolean;
  error: string | null;
  /** Registra un cigarro con la fecha y hora actuales. */
  registerNow: () => Promise<void>;
  /** Añade un cigarro en una fecha y hora concretas (registro manual). */
  addCigarette: (smokedAt: Date) => Promise<void>;
  editCigarette: (id: string, smokedAt: Date) => Promise<void>;
  removeCigarette: (id: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CigarettesContext = createContext<CigarettesContextValue | null>(null);

function insertSorted(cigarettes: Cigarette[], cigarette: Cigarette): Cigarette[] {
  const next = [...cigarettes, cigarette];
  next.sort((a, b) => a.smokedAt.getTime() - b.smokedAt.getTime());
  return next;
}

export function CigarettesProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [cigarettes, setCigarettes] = useState<Cigarette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  // Solo se cargan/escuchan cigarros cuando el usuario tiene la función activa;
  // así, con la función desactivada (o la migración sin ejecutar) no hay
  // consultas ni errores por la tabla ausente.
  const enabled = profile?.cigarettesEnabled ?? false;

  useEffect(() => {
    if (!userId || !enabled) {
      setCigarettes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    cigaretteService
      .listCigarettes(userId)
      .then((loaded) => {
        if (!cancelled) setCigarettes(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando cigarros.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  // Tiempo real entre dispositivos/pestañas; reconcilia por id.
  useEffect(() => {
    if (!userId || !enabled) return;
    const channel = supabase
      .channel(`cigarettes-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cigarettes', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCigarettes((current) => {
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id?: string }).id;
              return oldId ? current.filter((cig) => cig.id !== oldId) : current;
            }
            const row = payload.new as CigaretteRow;
            const cigarette: Cigarette = {
              id: row.id,
              userId: row.user_id,
              smokedAt: new Date(row.smoked_at),
            };
            return insertSorted(
              current.filter((existing) => existing.id !== cigarette.id),
              cigarette,
            );
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, enabled]);

  const addCigarette = useCallback(
    async (smokedAt: Date) => {
      if (!userId) throw new Error('No hay sesión activa.');
      const created = await cigaretteService.addCigarette(userId, smokedAt);
      setCigarettes((current) => insertSorted(current, created));
    },
    [userId],
  );

  const registerNow = useCallback(() => addCigarette(new Date()), [addCigarette]);

  const editCigarette = useCallback(async (id: string, smokedAt: Date) => {
    const updated = await cigaretteService.updateCigarette(id, smokedAt);
    setCigarettes((current) =>
      insertSorted(
        current.filter((cig) => cig.id !== id),
        updated,
      ),
    );
  }, []);

  const removeCigarette = useCallback(async (id: string) => {
    await cigaretteService.deleteCigarette(id);
    setCigarettes((current) => current.filter((cig) => cig.id !== id));
  }, []);

  const value = useMemo<CigarettesContextValue>(
    () => ({
      cigarettes,
      loading,
      error,
      registerNow,
      addCigarette,
      editCigarette,
      removeCigarette,
    }),
    [cigarettes, loading, error, registerNow, addCigarette, editCigarette, removeCigarette],
  );

  return <CigarettesContext.Provider value={value}>{children}</CigarettesContext.Provider>;
}
