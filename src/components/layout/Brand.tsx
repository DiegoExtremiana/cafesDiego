import { Coffee } from 'lucide-react';

/** Logotipo de la aplicación con vapor animado. */
export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const iconSize = size === 'lg' ? 'size-10' : 'size-6';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex rounded-xl bg-coffee-600 p-2 text-white shadow-sm">
        <Coffee className={iconSize} aria-hidden />
        <span className="absolute -top-1.5 left-2.5 h-2 w-0.5 rounded bg-coffee-300 animate-steam" />
        <span className="absolute -top-1.5 left-4 h-2 w-0.5 rounded bg-coffee-300 animate-steam [animation-delay:0.8s]" />
      </span>
      <span className={`font-bold tracking-tight text-coffee-900 ${textSize}`}>
        Contador de cafés
      </span>
    </span>
  );
}
