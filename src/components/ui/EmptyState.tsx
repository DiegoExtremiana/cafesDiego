import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center animate-fade-in">
      <span className="text-coffee-300">{icon}</span>
      <h3 className="text-sm font-semibold text-coffee-700">{title}</h3>
      {description && <p className="max-w-xs text-sm text-coffee-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
