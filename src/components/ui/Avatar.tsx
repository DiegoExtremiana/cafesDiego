import { useEffect, useState } from 'react';
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

/** Avatar del usuario: su foto de perfil o, si no tiene, la inicial por defecto. */
export function Avatar({ user, className = 'size-8 text-sm', zoomable = true }: AvatarProps) {
  const [zoomed, setZoomed] = useState(false);
  const name = user.displayName || user.username || '?';
  const canZoom = zoomable && Boolean(user.avatarUrl) && Boolean(user.isPublic);

  useEffect(() => {
    if (!zoomed) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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

  return (
    <>
      <img
        src={user.avatarUrl}
        alt={name}
        loading="lazy"
        onClick={
          canZoom
            ? (event) => {
                event.stopPropagation();
                setZoomed(true);
              }
            : undefined
        }
        className={`shrink-0 rounded-full object-cover ${canZoom ? 'cursor-zoom-in' : ''} ${className}`}
      />
      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto de ${name}`}
          >
            <img
              src={user.avatarUrl}
              alt={name}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl animate-pop"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
