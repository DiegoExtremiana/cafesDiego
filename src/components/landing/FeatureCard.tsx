import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Tarjeta de característica para la landing page. */
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group flex items-start gap-3.5 rounded-2xl border border-coffee-100 bg-white p-4 shadow-[0_1px_3px_rgba(70,48,31,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-coffee-200 hover:shadow-[0_8px_20px_rgba(70,48,31,0.12)]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-coffee-600 group-hover:text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h3 className="mb-0.5 text-sm font-semibold text-coffee-900">{title}</h3>
        <p className="text-sm text-coffee-500">{description}</p>
      </div>
    </div>
  );
}
