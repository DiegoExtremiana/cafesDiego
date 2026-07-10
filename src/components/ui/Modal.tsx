import { useEffect, type ReactNode } from 'react';
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
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Bloquea el scroll de la página mientras el modal está abierto, compensando
  // el ancho de la barra de scroll para que el contenido no salte.
  useEffect(() => {
    if (!open) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-coffee-950/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-pop`}
        onClick={(event) => event.stopPropagation()}
      >
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
  );
}
