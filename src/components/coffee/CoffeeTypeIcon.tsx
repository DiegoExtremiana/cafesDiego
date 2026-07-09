import type { CoffeeType } from '@/types/coffee';

interface CoffeeTypeIconProps {
  type: CoffeeType;
  className?: string;
}

const CUP = 'M5 8.5h13v6.5A4.5 4.5 0 0 1 13.5 19.5h-3A4.5 4.5 0 0 1 5 15V8.5Z';
const HANDLE = 'M18 10.5h1.3a2 2 0 1 1 0 4H18';

/** Icono SVG propio para cada tipo de café: misma taza base, distinto relleno o gesto según la intensidad. */
export function CoffeeTypeIcon({ type, className = 'size-4' }: CoffeeTypeIconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (type) {
    case 'espresso':
      // Taza sólida: dosis pequeña y densa.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.85} />
          <path d={HANDLE} />
        </svg>
      );
    case 'americano':
      // Solo contorno con ondas de agua: café diluido.
      return (
        <svg {...common}>
          <path d={CUP} />
          <path d={HANDLE} />
          <path d="M7.5 12.5c1.2-1 2.3 1 3.5 0s2.3-1 3.5 0" strokeWidth={1.4} />
        </svg>
      );
    case 'cortado':
      // Gota de leche sobre relleno ligero.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.3} />
          <path d={HANDLE} />
          <path
            d="M12 8.4c.9 1 1.5 1.8 1.5 2.6a1.5 1.5 0 1 1-3 0c0-.8.6-1.6 1.5-2.6Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case 'capuchino':
      // Burbujas de espuma asomando por encima del borde.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.45} />
          <path d={HANDLE} />
          <circle cx="9" cy="8.2" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="7.4" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="15" cy="8.2" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'latte':
      // Corazón de arte latte sobre relleno medio.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.45} />
          <path d={HANDLE} />
          <path
            d="M9.8 10.6c.6-.7 1.6-.7 2.2 0c.6-.7 1.6-.7 2.2 0c-.4 1-1.4 1.8-2.2 2.4c-.8-.6-1.8-1.4-2.2-2.4Z"
            strokeWidth={1.3}
          />
        </svg>
      );
    case 'otro':
    default:
      // Contorno discontinuo: tipo sin especificar.
      return (
        <svg {...common}>
          <path d={CUP} strokeDasharray="2.5 2" />
          <path d={HANDLE} />
        </svg>
      );
  }
}
