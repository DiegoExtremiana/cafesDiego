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
    case 'energetica':
      // Lata con rayo: bebida energética (vale 1,5 cafés).
      return (
        <svg {...common}>
          <path d="M8 6.5h8l-1 13.5a1.6 1.6 0 0 1-1.6 1.5h-2.8a1.6 1.6 0 0 1-1.6-1.5L8 6.5Z" />
          <path d="M8.2 9.2h7.6" strokeWidth={1.4} />
          <path
            d="M12.9 10.6l-2.5 3.9h1.8l-1.1 3.6 3.3-4.4h-1.9l1.7-3.1Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case 'te_negro':
      // Taza con bolsita colgando y té oscuro.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.5} />
          <path d={HANDLE} />
          <path d="M8.5 8.5V5.8" strokeWidth={1.4} />
          <rect x="6.9" y="3.2" width="3.2" height="2.6" rx="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'te_verde':
      // Taza clara con hoja de té.
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.18} />
          <path d={HANDLE} />
          <path
            d="M12 10.2c2.4 0 3.4 1.6 3.4 3.4c-1.8 0-3.4-1-3.4-3.4Zm0 0c-.6 1.2-1.4 2-2.6 2.4"
            strokeWidth={1.3}
          />
        </svg>
      );
    case 'matcha':
      // Cuenco ancho con vapor: té matcha batido.
      return (
        <svg {...common}>
          <path d="M5.5 11.5h13c0 4.4-2.6 7.5-6.5 7.5s-6.5-3.1-6.5-7.5Z" fill="currentColor" fillOpacity={0.35} />
          <path d="M9.8 5.5c0 1.1-.8 1.1-.8 2.2s.8 1.1.8 2.2M14 5.5c0 1.1-.8 1.1-.8 2.2s.8 1.1.8 2.2" strokeWidth={1.3} />
        </svg>
      );
    case 'cola':
      // Vaso alto con pajita y burbujas.
      return (
        <svg {...common}>
          <path d="M8 7l1.2 12.5a1.4 1.4 0 0 0 1.4 1.2h2.8a1.4 1.4 0 0 0 1.4-1.2L16 7H8Z" />
          <path d="M13 7l1.8-3.8" strokeWidth={1.4} />
          <circle cx="11" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="13" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="11.4" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'zumo':
      // Vaso con pajita y zumo hasta la mitad.
      return (
        <svg {...common}>
          <path d="M8.5 6.5l1 13.2a1.3 1.3 0 0 0 1.3 1.1h2.4a1.3 1.3 0 0 0 1.3-1.1l1-13.2h-7Z" />
          <path d="M9.3 12.5h5.4l-.5 6.6a.6.6 0 0 1-.6.6h-3.2a.6.6 0 0 1-.6-.6l-.5-6.6Z" fill="currentColor" stroke="none" fillOpacity={0.45} />
          <path d="M13.2 6.5l2-4" strokeWidth={1.4} />
        </svg>
      );
    case 'leche':
      // Brik de leche.
      return (
        <svg {...common}>
          <path d="M9.5 3.5h5l1.5 4V19a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19V7.5l1.5-4Z" />
          <path d="M8 7.5h8" strokeWidth={1.4} />
          <path d="M9.5 3.5l1.5 4V20.5" strokeWidth={1.2} />
        </svg>
      );
    case 'infusion':
      // Taza clara con vapor: manzanilla, tila...
      return (
        <svg {...common}>
          <path d={CUP} fill="currentColor" fillOpacity={0.12} />
          <path d={HANDLE} />
          <path d="M10 3.2c0 1-.8 1-.8 2s.8 1 .8 2M13.8 3.2c0 1-.8 1-.8 2s.8 1 .8 2" strokeWidth={1.3} />
        </svg>
      );
    case 'cerveza':
      // Botellín con cuello, etiqueta y chapa.
      return (
        <svg {...common}>
          <path d="M10 2.5h4" strokeWidth={1.6} />
          <path d="M10.3 2.8v2.1c0 .8-.4 1.3-1 1.9c-.7.7-1.1 1.4-1.1 2.5v10.3a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4V9.3c0-1.1-.4-1.8-1.1-2.5c-.6-.6-1-1.1-1-1.9V2.8" />
          <rect x="9.2" y="12" width="5.6" height="4.6" rx="0.6" fill="currentColor" stroke="none" fillOpacity={0.85} />
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
