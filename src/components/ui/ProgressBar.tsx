import { formatNumber } from '@/utils/format';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

/** Barra de progreso con color según el porcentaje alcanzado. */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const color =
    ratio < 0.5 ? 'bg-emerald-500' : ratio <= 0.75 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-coffee-500">
          <span>{label}</span>
          <span className="font-medium">
            {formatNumber(value)} / {formatNumber(max)}
          </span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-coffee-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
