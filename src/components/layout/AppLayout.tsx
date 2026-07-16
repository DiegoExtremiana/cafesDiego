import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import { Brand } from './Brand';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUnread } from '@/hooks/useUnread';
import { countPendingInvitations } from '@/services/groupService';

const navItems = [
  { to: '/panel', label: 'Panel', icon: LayoutDashboard },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/logros', label: 'Logros', icon: Trophy },
  { to: '/grupos', label: 'Grupos', icon: Users },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function navLinkClass(isActive: boolean): string {
  return `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-coffee-100 text-coffee-900' : 'text-coffee-500 hover:bg-coffee-50 hover:text-coffee-800'
  }`;
}

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { total: unreadTotal } = useUnread();
  const [pendingInvites, setPendingInvites] = useState(0);

  // Aviso del icono Grupos: invitaciones pendientes + mensajes sin leer.
  const groupsBadge = pendingInvites + unreadTotal;
  const groupsBadgeLabel = groupsBadge > 9 ? '9+' : groupsBadge;

  // Recuento de invitaciones pendientes para el aviso del menú; se refresca al
  // cambiar de ruta (p. ej. al volver de la página de grupos tras aceptar una).
  useEffect(() => {
    let cancelled = false;
    countPendingInvitations()
      .then((count) => {
        if (!cancelled) setPendingInvites(count);
      })
      .catch(() => {
        if (!cancelled) setPendingInvites(0);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-coffee-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/panel" aria-label="Ir al panel" className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-500">
            <Brand showText={false} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {navItems.map(({ to, label, icon: Icon }) => {
              const badge = to === '/grupos' && groupsBadge > 0;
              // Icono solo; el nombre aparece como tooltip al pasar el ratón o al enfocar.
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={({ isActive }) => `group relative ${navLinkClass(isActive)}`}
                >
                  <span className="relative">
                    <Icon className="size-4.5" aria-hidden />
                    {badge && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                        {groupsBadgeLabel}
                      </span>
                    )}
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-coffee-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {profile && <Avatar user={profile} className="size-8 text-xs" />}
            <span className="hidden text-sm text-coffee-500 sm:block">
              {profile?.displayName || profile?.username}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="rounded-xl p-2 text-coffee-400 transition-colors hover:bg-coffee-100 hover:text-coffee-700"
            >
              <LogOut className="size-4.5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Navegación inferior en móvil */}
      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-coffee-100 bg-white/95 backdrop-blur md:hidden"
      >
        <div className="flex py-1.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const badge = to === '/grupos' && pendingInvites > 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center text-[10px] font-medium transition-colors ${
                    isActive ? 'text-coffee-800' : 'text-coffee-400'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {badge && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {pendingInvites}
                    </span>
                  )}
                </span>
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
