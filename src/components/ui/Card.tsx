import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-coffee-100 bg-white shadow-[0_1px_3px_rgba(70,48,31,0.06)] ${padded ? 'p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string | undefined;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, actions }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-coffee-500">{icon}</span>}
        <div>
          <h2 className="text-sm font-semibold text-coffee-900">{title}</h2>
          {subtitle && <p className="text-xs text-coffee-400">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
