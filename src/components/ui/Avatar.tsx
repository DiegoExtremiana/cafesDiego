import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AvatarUser {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  /** Si el perfil es público, la foto puede ampliarse al pulsarla. */
  isPublic?: boolean;
}

interface AvatarProps {
  user: AvatarUser;
  /** Clases de tamaño y tipografía, p. ej. "size-8 text-xs". */
  className?: string;
  /** Permite ampliar la foto al pulsarla (solo si el perfil es público). Por defecto true. */
  zoomable?: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Avatar del usuario: su foto de perfil o, si no tiene, la inicial por defecto. */
export function Avatar({ user, className = 'size-8 text-sm', zoomable = true }: AvatarProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const originRef = useRef<Rect | null>(null);
  const closingRef = useRef(false);
  const [zoomed, setZoomed] = useState(false);
  // false = geometría de origen (avatar pequeño); true = ampliada y centrada.
  const [expanded, setExpanded] = useState(false);

  const name = user.displayName || user.username || '?';
  const canZoom = zoomable && Boolean(user.avatarUrl) && Boolean(user.isPublic);

  const openZoom = () => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    originRef.current = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    closingRef.current = false;
    setZoomed(true);
    setExpanded(false);
    // Dos frames: pinta primero en la posición del avatar y luego anima al centro.
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
  };

  const closeZoom = () => {
    closingRef.current = true;
    setExpanded(false); // vuelve, animando, a la posición original
  };

  // Escape cierra; bloquea el scroll de la página mientras la foto está ampliada.
  useEffect(() => {
    if (!zoomed) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoom();
    };
    document.addEventListener('keydown', handleKey);
    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [zoomed]);

  if (!user.avatarUrl) {
    return (
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-coffee-100 font-bold uppercase text-coffee-600 ${className}`}
      >
        {name.slice(0, 1)}
      </span>
    );
  }

  // Destino: un cuadrado centrado (las fotos se guardan cuadradas).
  const side = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
  const target: Rect = {
    top: (window.innerHeight - side) / 2,
    left: (window.innerWidth - side) / 2,
    width: side,
    height: side,
  };
  const origin = originRef.current;
  const geometry: Rect | null = expanded ? target : origin;

  return (
    <>
      <img
        ref={imgRef}
        src={user.avatarUrl}
        alt={name}
        loading="lazy"
        onClick={
          canZoom
            ? (event) => {
                event.stopPropagation();
                openZoom();
              }
            : undefined
        }
        className={`shrink-0 rounded-full object-cover ${canZoom ? 'cursor-zoom-in' : ''} ${className}`}
      />
      {zoomed &&
        origin &&
        createPortal(
          <div
            className="fixed inset-0 z-60"
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              opacity: expanded ? 1 : 0,
              transition: 'opacity 300ms ease',
            }}
            onClick={closeZoom}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto de ${name}`}
          >
            {geometry && (
              <img
                src={user.avatarUrl}
                alt={name}
                onClick={(event) => {
                  event.stopPropagation();
                  closeZoom();
                }}
                onTransitionEnd={(event) => {
                  if (closingRef.current && event.propertyName === 'width') {
                    closingRef.current = false;
                    setZoomed(false);
                  }
                }}
                style={{
                  position: 'fixed',
                  margin: 0,
                  objectFit: 'cover',
                  cursor: 'zoom-out',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  top: geometry.top,
                  left: geometry.left,
                  width: geometry.width,
                  height: geometry.height,
                  borderRadius: expanded ? 24 : 9999,
                  transition:
                    'top 300ms ease, left 300ms ease, width 300ms ease, height 300ms ease, border-radius 300ms ease',
                }}
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
