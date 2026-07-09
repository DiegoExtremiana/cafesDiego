import { Coffee as CoffeeIcon, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDuration, formatTime, minutesBetween } from '@/utils/dates';
import type { Coffee } from '@/types/coffee';

interface CoffeeListProps {
  /** Cafés de un mismo día, en orden ascendente. */
  coffees: Coffee[];
  onEdit: (coffee: Coffee) => void;
  onDelete: (coffee: Coffee) => void;
}

/** Lista de los cafés de un día con el intervalo desde el anterior. */
export function CoffeeList({ coffees, onEdit, onDelete }: CoffeeListProps) {
  if (coffees.length === 0) {
    return (
      <EmptyState
        icon={<CoffeeIcon className="size-10" aria-hidden />}
        title="Sin cafés este día"
        description="No hay ningún café registrado en esta fecha."
      />
    );
  }

  return (
    <ul className="divide-y divide-coffee-100">
      {coffees.map((coffee, index) => {
        const previous = coffees[index - 1];
        return (
          <li
            key={coffee.id}
            className="flex items-center justify-between gap-3 py-3 animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600">
                <CoffeeIcon className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold tabular-nums text-coffee-900">
                  {formatTime(coffee.takenAt)}
                </p>
                <p className="text-xs text-coffee-400">
                  {previous
                    ? `${formatDuration(minutesBetween(previous.takenAt, coffee.takenAt))} desde el anterior`
                    : 'Primer café del día'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(coffee)}
                aria-label={`Editar café de las ${formatTime(coffee.takenAt)}`}
                className="rounded-lg p-2 text-coffee-400 transition-colors hover:bg-coffee-100 hover:text-coffee-700"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDelete(coffee)}
                aria-label={`Eliminar café de las ${formatTime(coffee.takenAt)}`}
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
