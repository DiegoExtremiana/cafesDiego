import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as coffeeService from '@/services/coffeeService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Coffee, CoffeeDetails, CoffeeType } from '@/types/coffee';
import type { CoffeeRow } from '@/types/database';

export interface CoffeesContextValue {
  /** Todos los cafés del usuario, en orden cronológico ascendente. */
  coffees: Coffee[];
  loading: boolean;
  error: string | null;
  /** Registra un café con la fecha y hora actuales; admite tipo y cafeína opcionales. */
  registerNow: (details?: CoffeeDetails) => Promise<void>;
  /** Añade un café en una fecha y hora concretas (registro manual). */
  addCoffee: (takenAt: Date, details?: CoffeeDetails) => Promise<void>;
  editCoffee: (id: string, takenAt: Date) => Promise<void>;
  /** Actualiza tipo y cafeína al vuelo (usado por el slider del historial). */
  updateCoffeeDetails: (id: string, details: CoffeeDetails) => Promise<void>;
  removeCoffee: (id: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CoffeesContext = createContext<CoffeesContextValue | null>(null);

function insertSorted(coffees: Coffee[], coffee: Coffee): Coffee[] {
  const next = [...coffees, coffee];
  next.sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  return next;
}

export function CoffeesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCoffees([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    coffeeService
      .listCoffees(userId)
      .then((loaded) => {
        if (!cancelled) setCoffees(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando cafés.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tiempo real: refleja los cafés añadidos/editados/borrados en otros
  // dispositivos o pestañas. Reconcilia por id, así que no duplica el update
  // optimista local. (Requiere la tabla `coffees` en la publicación
  // supabase_realtime; sin ella, simplemente no llegan eventos.)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`coffees-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coffees', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCoffees((current) => {
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id?: string }).id;
              return oldId ? current.filter((coffee) => coffee.id !== oldId) : current;
            }
            const row = payload.new as CoffeeRow;
            const coffee: Coffee = {
              id: row.id,
              userId: row.user_id,
              takenAt: new Date(row.taken_at),
              type: row.type as CoffeeType,
              hasCaffeine: row.has_caffeine,
            };
            return insertSorted(
              current.filter((existing) => existing.id !== coffee.id),
              coffee,
            );
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const addCoffee = useCallback(
    async (takenAt: Date, details?: CoffeeDetails) => {
      if (!userId) throw new Error('No hay sesión activa.');
      const created = await coffeeService.addCoffee(userId, takenAt, details);
      setCoffees((current) => insertSorted(current, created));
    },
    [userId],
  );

  const registerNow = useCallback(
    (details?: CoffeeDetails) => addCoffee(new Date(), details),
    [addCoffee],
  );

  const editCoffee = useCallback(async (id: string, takenAt: Date) => {
    const updated = await coffeeService.updateCoffee(id, takenAt);
    setCoffees((current) =>
      insertSorted(
        current.filter((coffee) => coffee.id !== id),
        updated,
      ),
    );
  }, []);

  const updateCoffeeDetails = useCallback(async (id: string, details: CoffeeDetails) => {
    const updated = await coffeeService.updateCoffeeDetails(id, details);
    setCoffees((current) =>
      insertSorted(
        current.filter((coffee) => coffee.id !== id),
        updated,
      ),
    );
  }, []);

  const removeCoffee = useCallback(async (id: string) => {
    await coffeeService.deleteCoffee(id);
    setCoffees((current) => current.filter((coffee) => coffee.id !== id));
  }, []);

  const value = useMemo<CoffeesContextValue>(
    () => ({
      coffees,
      loading,
      error,
      registerNow,
      addCoffee,
      editCoffee,
      updateCoffeeDetails,
      removeCoffee,
    }),
    [coffees, loading, error, registerNow, addCoffee, editCoffee, updateCoffeeDetails, removeCoffee],
  );

  return <CoffeesContext.Provider value={value}>{children}</CoffeesContext.Provider>;
}
