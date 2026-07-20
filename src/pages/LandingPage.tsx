import { Link } from 'react-router-dom';
import {
  BarChart3,
  Coffee,
  Download,
  Globe,
  LineChart,
  LogIn,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { InstallButton } from '@/components/landing/InstallButton';

const FEATURES = [
  {
    icon: Coffee,
    title: 'Registro en un toque',
    description: 'Pulsa un botón para guardar la hora exacta de cada café, o añade y edita cafés de cualquier día.',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas completas',
    description: 'Consumo de hoy, de la semana, del mes con comparativa y de todo tu histórico, siempre al día.',
  },
  {
    icon: LineChart,
    title: 'Gráficos interactivos',
    description: 'Evolución diaria, semanal y mensual, distribución por hora y un calendario anual tipo GitHub.',
  },
  {
    icon: Trophy,
    title: 'Logros y curiosidades',
    description: 'Desbloquea logros por cafés y días registrados, y descubre datos curiosos sobre tus hábitos.',
  },
  {
    icon: Globe,
    title: 'Perfil público',
    description: 'Comparte tus estadísticas con un enlace propio, con control total sobre qué secciones se ven.',
  },
  {
    icon: Download,
    title: 'Tus datos son tuyos',
    description: 'Exporta todo tu historial a CSV o JSON cuando quieras, sin permisos ni esperas.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-coffee-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Brand />
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-coffee-700 transition-colors hover:bg-coffee-100 sm:px-4"
            >
              <LogIn className="size-4" aria-hidden />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
            <Link
              to="/registro"
              aria-label="Crear cuenta"
              className="flex items-center gap-1.5 rounded-xl bg-coffee-600 px-2.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coffee-700 sm:px-4"
            >
              <UserPlus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Crear cuenta</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="flex flex-col items-start gap-6 animate-slide-up">
            <span className="relative inline-flex rounded-2xl bg-coffee-600 p-5 text-white shadow-lg">
              <Coffee className="size-12" aria-hidden />
              <span className="absolute -top-2 left-5 h-3 w-1 rounded bg-coffee-300 animate-steam" />
              <span className="absolute -top-2 left-9 h-3 w-1 rounded bg-coffee-300 animate-steam [animation-delay:0.8s]" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-coffee-950 sm:text-5xl">
              Conoce tus hábitos de café
            </h1>
            <p className="max-w-lg text-base text-coffee-500 sm:text-lg">
              Registra cada café de tu jornada laboral y descubre tu ritmo, tus horas favoritas y
              tu progreso con estadísticas y gráficos pensados para algo más que contar tazas.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/registro"
                className="rounded-xl bg-coffee-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-coffee-700"
              >
                Empezar gratis
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-coffee-200 bg-white px-6 py-3 text-base font-medium text-coffee-800 transition-colors hover:bg-coffee-50"
              >
                Ya tengo cuenta
              </Link>
              <InstallButton />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-coffee-100 py-6 text-center text-xs text-coffee-400">
        Contador de cafés — sin anuncios, sin seguimiento de terceros.
      </footer>
    </div>
  );
}
