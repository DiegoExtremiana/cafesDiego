import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

/** Solo deja pasar a usuarios autenticados; si no, redirige al login. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner label="Recuperando sesión..." />
      </main>
    );
  }
  return session ? <Outlet /> : <Navigate to="/login" replace />;
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
  return session ? <Navigate to="/" replace /> : <Outlet />;
}
