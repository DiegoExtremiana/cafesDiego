import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { deleteAvatar, uploadAvatar } from '@/services/avatarService';

/** Gestión de la foto de perfil: subir/cambiar y eliminar (Ajustes → Perfil). */
export function AvatarManager() {
  const { user, profile, updateProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bloquea el scroll de la página mientras se procesa/sube la foto.
  useEffect(() => {
    if (!busy) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [busy]);

  if (!user || !profile) return null;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile({ avatarUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAvatar(user.id);
      await updateProfile({ avatarUrl: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex items-center gap-4">
        <Avatar user={profile} className="size-16 text-xl" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-4" aria-hidden />
              {profile.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {profile.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </Button>
            )}
          </div>
          <p className="text-xs text-coffee-400">JPG, PNG o WebP · máx. 5 MB.</p>
        </div>
      </div>
    </div>
  );
}
