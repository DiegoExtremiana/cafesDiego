import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
} from 'lucide-react';
import { Brand } from './Brand';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/panel', label: 'Panel', icon: LayoutDashboard },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/logros', label: 'Logros', icon: Trophy },
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-coffee-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/panel" aria-label="Ir al panel" className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-500">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => navLinkClass(isActive)}>
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
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
        <div className="flex justify-around py-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-coffee-800' : 'text-coffee-400'
                }`
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
