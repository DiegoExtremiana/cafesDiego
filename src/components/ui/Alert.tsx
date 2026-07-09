import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Variant = 'error' | 'success' | 'info';

const variantClasses: Record<Variant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-coffee-200 bg-coffee-50 text-coffee-800',
};

const icons: Record<Variant, ReactNode> = {
  error: <AlertCircle className="size-4 shrink-0" aria-hidden />,
  success: <CheckCircle2 className="size-4 shrink-0" aria-hidden />,
  info: <Info className="size-4 shrink-0" aria-hidden />,
};

export function Alert({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm animate-fade-in ${variantClasses[variant]}`}
    >
      {icons[variant]}
      <span>{children}</span>
    </div>
  );
}
