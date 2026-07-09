import type { ReactNode } from 'react';

export interface StatListItem {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'negative';
}

const toneClasses = {
  default: 'text-coffee-900',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
} as const;

/** Lista compacta de pares etiqueta/valor para tarjetas de resumen. */
export function StatList({ items }: { items: StatListItem[] }) {
  return (
    <dl className="divide-y divide-coffee-50">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 py-2">
          <dt className="flex items-center gap-1.5 text-sm text-coffee-500">
            {item.icon}
            {item.label}
          </dt>
          <dd
            className={`text-sm font-semibold tabular-nums ${toneClasses[item.tone ?? 'default']}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
