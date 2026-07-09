import { Link } from 'react-router-dom';
import {
  BarChart3,
  Coffee,
  Download,
  Globe,
  LineChart,
  Trophy,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { FeatureCard } from '@/components/landing/FeatureCard';

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
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-coffee-700 transition-colors hover:bg-coffee-100"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="rounded-xl bg-coffee-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coffee-700"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center animate-fade-in">
          <span className="relative inline-flex rounded-2xl bg-coffee-600 p-5 text-white shadow-lg">
            <Coffee className="size-12" aria-hidden />
            <span className="absolute -top-2 left-5 h-3 w-1 rounded bg-coffee-300 animate-steam" />
            <span className="absolute -top-2 left-9 h-3 w-1 rounded bg-coffee-300 animate-steam [animation-delay:0.8s]" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-coffee-950 sm:text-5xl">
            Conoce tus hábitos de café
          </h1>
          <p className="max-w-xl text-base text-coffee-500 sm:text-lg">
            Registra cada café de tu jornada laboral y descubre tu ritmo, tus horas favoritas y
            tu progreso con estadísticas y gráficos pensados para algo más que contar tazas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="border-t border-coffee-100 bg-coffee-50">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-coffee-950">
              Tu próximo café, con contexto
            </h2>
            <p className="text-coffee-500">
              Crea tu cuenta en un minuto y empieza a registrar. Las estadísticas se construyen
              solas a partir de tus datos, café a café.
            </p>
            <Link
              to="/registro"
              className="rounded-xl bg-coffee-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-coffee-700"
            >
              Crear mi cuenta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-coffee-100 py-6 text-center text-xs text-coffee-400">
        Contador de cafés — sin anuncios, sin seguimiento de terceros.
      </footer>
    </div>
  );
}
