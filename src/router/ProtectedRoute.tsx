import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import LandingPage from '@/pages/LandingPage';

/** true si la app corre como PWA instalada (standalone), no en pestaña normal. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari usa una propiedad propietaria en lugar de display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Ruta raíz. En PWA instalada, un usuario con sesión va directo al panel para
 * pulsar «Contar café»; en el navegador siempre se muestra la landing.
 */
export function LandingRoute() {
  const { session, loading } = useAuth();
  if (isStandalone()) {
    if (loading) {
      return (
        <main className="flex min-h-screen items-center justify-center">
          <Spinner label="Recuperando sesión..." />
        </main>
      );
    }
    if (session) return <Navigate to="/panel" replace />;
  }
  return <LandingPage />;
}

/** Solo deja pasar a usuarios autenticados; si no, redirige a la landing. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner label="Recuperando sesión..." />
      </main>
    );
  }
  return session ? <Outlet /> : <Navigate to="/" replace />;
}

/** Solo deja pasar a visitantes; los usuarios autenticados van al panel. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner label="Recuperando sesión..." />
      </main>
    );
  }
  return session ? <Navigate to="/panel" replace /> : <Outlet />;
}
