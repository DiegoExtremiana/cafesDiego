import { Coffee } from 'lucide-react';

/** Indicador de carga a pantalla parcial con estética cafetera. */
export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-coffee-400">
      <div className="relative">
        <Coffee className="size-8 animate-pulse" aria-hidden />
        <span className="absolute -top-2 left-2 h-2 w-0.5 rounded bg-coffee-300 animate-steam" />
        <span className="absolute -top-2 left-4 h-2 w-0.5 rounded bg-coffee-300 animate-steam [animation-delay:0.6s]" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
