import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string | undefined;
  tone?: 'default' | 'positive' | 'negative';
}

const toneClasses = {
  default: 'text-coffee-900',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
} as const;

/** Tarjeta compacta de métrica para el panel y las estadísticas. */
export function StatCard({ icon, label, value, sub, tone = 'default' }: StatCardProps) {
  return (
    <Card className="animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-coffee-400">{label}</p>
          <p className={`truncate text-xl font-bold tabular-nums ${toneClasses[tone]}`}>{value}</p>
          {sub && <p className="text-xs text-coffee-400">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
