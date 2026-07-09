import type { ReactNode } from 'react';
import { Brand } from './Brand';
import { Card } from '@/components/ui/Card';

/** Contenedor centrado para las páginas de autenticación. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream-100 p-4">
      <Brand size="lg" />
      <Card className="w-full max-w-sm animate-slide-up p-7">{children}</Card>
      <p className="text-xs text-coffee-400">
        Registra tu consumo de café y descubre tus hábitos
      </p>
    </main>
  );
}
