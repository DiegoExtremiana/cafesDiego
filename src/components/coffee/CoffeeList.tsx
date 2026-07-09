import { useState } from 'react';
import { Coffee as CoffeeIcon, Pencil, Trash2, Zap, ZapOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toggle } from '@/components/ui/Toggle';
import { CoffeeTypeIcon } from './CoffeeTypeIcon';
import { formatDuration, formatTime, minutesBetween } from '@/utils/dates';
import { COFFEE_TYPES, COFFEE_TYPE_LABELS, type Coffee, type CoffeeDetails } from '@/types/coffee';

interface CoffeeListProps {
  /** Cafés de un mismo día, en orden ascendente. */
  coffees: Coffee[];
  onEdit: (coffee: Coffee) => void;
  onDelete: (coffee: Coffee) => void;
  /** Guarda tipo y cafeína al vuelo, sin confirmación aparte. */
  onUpdateDetails: (coffee: Coffee, details: CoffeeDetails) => Promise<void>;
}

/** Lista de los cafés de un día con el intervalo desde el anterior. */
export function CoffeeList({ coffees, onEdit, onDelete, onUpdateDetails }: CoffeeListProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUpdate = async (coffee: Coffee, details: CoffeeDetails) => {
    setErrors((current) => {
      const { [coffee.id]: _removed, ...rest } = current;
      return rest;
    });
    try {
      await onUpdateDetails(coffee, details);
    } catch (err) {
      setErrors((current) => ({
        ...current,
        [coffee.id]: err instanceof Error ? err.message : 'No se pudo guardar.',
      }));
    }
  };

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
          <li key={coffee.id} className="flex flex-col gap-2.5 py-3 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600">
                  <CoffeeTypeIcon type={coffee.type} className="size-4.5" />
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pl-12">
              <div className="flex flex-wrap gap-1">
                {COFFEE_TYPES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    title={COFFEE_TYPE_LABELS[value]}
                    aria-label={`Cambiar a ${COFFEE_TYPE_LABELS[value]}`}
                    aria-pressed={coffee.type === value}
                    onClick={() => handleUpdate(coffee, { type: value, hasCaffeine: coffee.hasCaffeine })}
                    className={`flex size-7 items-center justify-center rounded-lg border transition-colors ${
                      coffee.type === value
                        ? 'border-coffee-600 bg-coffee-50 text-coffee-800'
                        : 'border-transparent text-coffee-300 hover:bg-coffee-50 hover:text-coffee-600'
                    }`}
                  >
                    <CoffeeTypeIcon type={value} className="size-4" />
                  </button>
                ))}
              </div>
              <div className="w-40">
                <Toggle
                  checked={coffee.hasCaffeine}
                  onChange={(checked) =>
                    handleUpdate(coffee, { type: coffee.type, hasCaffeine: checked })
                  }
                  label="Con cafeína"
                  activeLabel="Con cafeína"
                  inactiveLabel="Sin cafeína"
                  activeIcon={<Zap className="size-4" aria-hidden />}
                  inactiveIcon={<ZapOff className="size-4" aria-hidden />}
                />
              </div>
            </div>
            {errors[coffee.id] && (
              <p className="pl-12 text-xs text-red-600">{errors[coffee.id]}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
