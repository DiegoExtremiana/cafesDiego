import { useRef, useState } from 'react';
import { Check, Cigarette, Coffee } from 'lucide-react';
import { useCoffees } from '@/hooks/useCoffees';
import { useCigarettes } from '@/hooks/useCigarettes';
import { useAuth } from '@/hooks/useAuth';
import { CoffeeDetailsModal } from './CoffeeDetailsModal';
import type { CoffeeDetails } from '@/types/coffee';

const LONG_PRESS_MS = 500;

/**
 * Botón principal de la aplicación: registra un café con la hora actual.
 * Un toque rápido registra un café por defecto; mantenerlo pulsado abre
 * un modal para elegir el tipo de café y si tenía cafeína.
 */
export function RegisterCoffeeButton() {
  const { registerNow } = useCoffees();
  const { profile } = useAuth();
  const { registerNow: registerCigaretteNow } = useCigarettes();
  const cigarettesEnabled = profile?.cigarettesEnabled ?? false;
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [cigState, setCigState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cigResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const registerCigarette = async () => {
    if (cigState === 'saving') return;
    setError(null);
    setCigState('saving');
    try {
      await registerCigaretteNow();
      setCigState('done');
      if (cigResetTimer.current) clearTimeout(cigResetTimer.current);
      cigResetTimer.current = setTimeout(() => setCigState('idle'), 1500);
    } catch (err) {
      setCigState('idle');
      setError(err instanceof Error ? err.message : 'No se pudo registrar el cigarro.');
    }
  };

  const register = async (details?: CoffeeDetails) => {
    if (state === 'saving') return;
    setError(null);
    setState('saving');
    try {
      await registerNow(details);
      setState('done');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setState('idle'), 1800);
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'No se pudo registrar el café.');
    }
  };

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = () => {
    if (state === 'saving') return;
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setDetailsOpen(true);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    const wasLongPress = longPressFired.current;
    clearPressTimer();
    if (!wasLongPress) void register();
  };

  const handleDetailsSubmit = async (details: CoffeeDetails) => {
    await register(details);
    setDetailsOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(event) => event.preventDefault()}
        disabled={state === 'saving'}
        className={`group relative flex size-44 select-none flex-col items-center justify-center gap-2 rounded-full text-white shadow-lg transition-all duration-300 touch-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-coffee-300 active:scale-95 sm:size-52 ${
          state === 'done'
            ? 'bg-emerald-600'
            : 'bg-coffee-600 hover:bg-coffee-700 hover:shadow-xl'
        } ${state === 'saving' ? 'animate-pulse' : ''}`}
      >
        {/* Vapor animado sobre la taza */}
        <span className="pointer-events-none absolute top-8 left-1/2 -ml-3 h-3 w-1 rounded bg-white/50 animate-steam" />
        <span className="pointer-events-none absolute top-8 left-1/2 ml-1 h-3 w-1 rounded bg-white/50 animate-steam [animation-delay:0.7s]" />
        {state === 'done' ? (
          <Check className="size-14 animate-pop" aria-hidden />
        ) : (
          <Coffee className="size-14 transition-transform duration-300 group-hover:scale-110" aria-hidden />
        )}
        <span className="text-base font-semibold">
          {state === 'done' ? 'Registrado' : state === 'saving' ? 'Guardando...' : 'Registrar café'}
        </span>
      </button>
        {/* Botón pequeño para contar cigarros, en la esquina superior derecha. */}
        {cigarettesEnabled && (
          <button
            type="button"
            onClick={registerCigarette}
            disabled={cigState === 'saving'}
            aria-label="Registrar cigarro"
            title="Registrar cigarro"
            className={`absolute right-0 top-0 z-10 flex size-12 items-center justify-center rounded-full border shadow-md transition-all duration-200 active:scale-95 disabled:opacity-60 sm:size-14 ${
              cigState === 'done'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-coffee-200 bg-white text-coffee-700 hover:bg-coffee-50 hover:text-coffee-900'
            }`}
          >
            {cigState === 'done' ? (
              <Check className="size-6 animate-pop" aria-hidden />
            ) : (
              <Cigarette className="size-6" aria-hidden />
            )}
          </button>
        )}
      </div>
      <p className="text-xs text-coffee-400">Mantén pulsado para elegir tipo y cafeína</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <CoffeeDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onSubmit={handleDetailsSubmit}
      />
    </div>
  );
}
