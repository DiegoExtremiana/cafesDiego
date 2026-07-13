import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Ancho máximo del diálogo: 'md' (formularios) o 'xl' (contenido ancho, p. ej. gráficos). */
  size?: 'md' | 'xl';
}

const sizeClasses = {
  md: 'max-w-md',
  xl: 'max-w-4xl',
} as const;

export function Modal({ open, title, onClose, children, size = 'md' }: ModalProps) {
  // `render` mantiene el modal montado durante la animación de salida.
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [animateSize, setAnimateSize] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Al abrir monta; al cerrar reproduce la salida y desmonta al terminar.
  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
    } else if (render) {
      setClosing(true);
    }
  }, [open, render]);

  // Cierra con Escape.
  useEffect(() => {
    if (!render) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [render, onClose]);

  // Bloquea el scroll de la página mientras el modal está montado, compensando
  // el ancho de la barra de scroll para que el contenido no salte.
  useEffect(() => {
    if (!render) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [render]);

  // Mide el contenido para animar los cambios de tamaño (p. ej. al cambiar de
  // sección). El alto se limita al 90% de la ventana; el resto hace scroll.
  useLayoutEffect(() => {
    if (!render) return;
    const element = contentRef.current;
    if (!element) return;
    const measure = () => {
      const cap = window.innerHeight * 0.9;
      setHeight(Math.min(element.offsetHeight, cap));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [render, size]);

  // Activa la transición de tamaño tras el primer render, para no animar el
  // alto al abrir (de eso se encarga la animación de entrada).
  useEffect(() => {
    if (!render) {
      setAnimateSize(false);
      return;
    }
    const id = requestAnimationFrame(() => setAnimateSize(true));
    return () => cancelAnimationFrame(id);
  }, [render]);

  if (!render) return null;

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Solo la animación propia del diálogo (no la de un hijo que burbujea).
    if (event.target !== event.currentTarget) return;
    if (closing) {
      setRender(false);
      setClosing(false);
      setHeight(undefined);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-coffee-950/40 p-4 backdrop-blur-sm ${
        closing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
        style={{
          height,
          maxHeight: '90vh',
          transition: animateSize ? 'height 300ms ease-out, max-width 300ms ease-out' : undefined,
        }}
        className={`w-full ${sizeClasses[size]} overflow-hidden rounded-2xl bg-white shadow-xl ${
          closing ? 'animate-pop-out' : 'animate-pop'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div ref={contentRef} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-coffee-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-coffee-400 transition-colors hover:bg-coffee-100 hover:text-coffee-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
