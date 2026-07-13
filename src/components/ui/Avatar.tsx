interface AvatarUser {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

interface AvatarProps {
  user: AvatarUser;
  /** Clases de tamaño y tipografía, p. ej. "size-8 text-xs". */
  className?: string;
}

/** Avatar del usuario: su foto de perfil o, si no tiene, la inicial por defecto. */
export function Avatar({ user, className = 'size-8 text-sm' }: AvatarProps) {
  const name = user.displayName || user.username || '?';
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-coffee-100 font-bold uppercase text-coffee-600 ${className}`}
    >
      {name.slice(0, 1)}
    </span>
  );
}
