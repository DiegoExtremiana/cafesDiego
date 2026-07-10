import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CoffeesProvider } from '@/contexts/CoffeesContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/router/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Páginas con gráficos u otras dependencias pesadas: carga diferida.
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const StatsPage = lazy(() => import('@/pages/StatsPage'));
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const PublicProfilePage = lazy(() => import('@/pages/PublicProfilePage'));

// HashRouter: compatible con GitHub Pages sin configuración de servidor.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<Spinner label="Cargando..." />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
            </Route>

            <Route path="/u/:username" element={<PublicProfilePage />} />

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <CoffeesProvider>
                    <AppLayout />
                  </CoffeesProvider>
                }
              >
                <Route path="/panel" element={<DashboardPage />} />
                <Route path="/historial" element={<HistoryPage />} />
                <Route path="/estadisticas" element={<StatsPage />} />
                <Route path="/logros" element={<AchievementsPage />} />
                <Route path="/grupos" element={<GroupsPage />} />
                <Route path="/ajustes" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
