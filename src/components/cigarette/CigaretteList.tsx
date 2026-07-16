import { Cigarette as CigaretteIcon, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDuration, formatTime, minutesBetween } from '@/utils/dates';
import type { Cigarette } from '@/types/cigarette';

interface CigaretteListProps {
  /** Cigarros de un mismo día, en orden ascendente. */
  cigarettes: Cigarette[];
  onEdit: (cigarette: Cigarette) => void;
  onDelete: (cigarette: Cigarette) => void;
}

/** Lista de los cigarros de un día con el intervalo desde el anterior. */
export function CigaretteList({ cigarettes, onEdit, onDelete }: CigaretteListProps) {
  if (cigarettes.length === 0) {
    return (
      <EmptyState
        icon={<CigaretteIcon className="size-10" aria-hidden />}
        title="Sin cigarros este día"
        description="No hay ningún cigarro registrado en esta fecha."
      />
    );
  }

  return (
    <ul className="divide-y divide-coffee-100">
      {cigarettes.map((cigarette, index) => {
        const previous = cigarettes[index - 1];
        return (
          <li key={cigarette.id} className="flex items-center justify-between gap-3 py-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600">
                <CigaretteIcon className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold tabular-nums text-coffee-900">
                  {formatTime(cigarette.smokedAt)}
                </p>
                <p className="text-xs text-coffee-400">
                  {previous
                    ? `${formatDuration(minutesBetween(previous.smokedAt, cigarette.smokedAt))} desde el anterior`
                    : 'Primer cigarro del día'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(cigarette)}
                aria-label={`Editar cigarro de las ${formatTime(cigarette.smokedAt)}`}
                className="rounded-lg p-2 text-coffee-400 transition-colors hover:bg-coffee-100 hover:text-coffee-700"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDelete(cigarette)}
                aria-label={`Eliminar cigarro de las ${formatTime(cigarette.smokedAt)}`}
                className="rounded-lg p-2 text-coffee-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
