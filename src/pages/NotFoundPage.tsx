import { Link } from 'react-router-dom';
import { CoffeeIcon } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100 p-4 text-center">
      <CoffeeIcon className="size-12 text-coffee-300" aria-hidden />
      <h1 className="text-2xl font-bold text-coffee-900">Página no encontrada</h1>
      <p className="text-sm text-coffee-500">Parece que esta taza está vacía.</p>
      <Link
        to="/"
        className="rounded-xl bg-coffee-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coffee-700"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
