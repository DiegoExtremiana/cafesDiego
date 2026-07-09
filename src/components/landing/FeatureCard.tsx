import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Tarjeta de característica para la landing page. */
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-coffee-100 bg-white p-5 shadow-[0_1px_3px_rgba(70,48,31,0.06)] transition-transform duration-200 hover:-translate-y-1">
      <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mb-1 text-sm font-semibold text-coffee-900">{title}</h3>
      <p className="text-sm text-coffee-500">{description}</p>
    </div>
  );
}
