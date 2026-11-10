import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { authLinkErrorCode, openedFromRecoveryLink } from '@/lib/supabase';

/**
 * Gestiona la vuelta desde los enlaces del correo de Supabase: lleva a
 * /restablecer al abrir el de recuperación y a /recuperar si el enlace caducó.
 */
export function AuthLinkGate({ children }: { children: ReactNode }) {
  const { loading, passwordRecovery } = useAuth();
  const { pathname } = useLocation();
  const [linkError, setLinkError] = useState(authLinkErrorCode);

  useEffect(() => {
    if (linkError && pathname === '/recuperar') setLinkError(null);
  }, [linkError, pathname]);

  // Mientras Supabase procesa los tokens, el hash aún no es una ruta válida.
  if (loading && openedFromRecoveryLink) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner label="Comprobando enlace..." />
      </main>
    );
  }
  if (linkError && pathname !== '/recuperar') {
    return <Navigate to="/recuperar" replace state={{ linkExpired: true }} />;
  }
  if (!loading && passwordRecovery && pathname !== '/restablecer') {
    return <Navigate to="/restablecer" replace />;
  }
  return children;
}
