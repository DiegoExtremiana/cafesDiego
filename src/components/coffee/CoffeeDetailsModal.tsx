import { useEffect, useRef, useState } from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CoffeeTypeIcon } from './CoffeeTypeIcon';
import {
  COFFEE_TYPE_LABELS,
  COFFEE_TYPE_VALUES,
  coffeeTypesFor,
  type CoffeeDetails,
  type CoffeeType,
} from '@/types/coffee';
import { coffeeLabel, formatNumber } from '@/utils/format';

interface CoffeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CoffeeDetails) => Promise<void>;
}

/**
 * Grupos del selector, separados visualmente por una línea fina:
 * cafés (siempre visibles), tés e infusiones, y otras bebidas.
 * Los grupos 2 y 3 dependen del estado del interruptor de cafeína.
 */
const TYPE_GROUPS: CoffeeType[][] = [
  ['espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro'],
  ['te_negro', 'te_verde', 'matcha', 'infusion'],
  ['energetica', 'cola', 'zumo', 'leche'],
];

/** Duración del desvanecimiento de las opciones que se van al cambiar la cafeína. */
const SWAP_MS = 180;

/** Modal que se abre al mantener pulsado el botón de registro, para elegir tipo y cafeína. */
export function CoffeeDetailsModal({ open, onClose, onSubmit }: CoffeeDetailsModalProps) {
  const [type, setType] = useState<CoffeeType>('espresso');
  const [hasCaffeine, setHasCaffeine] = useState(true);
  // Copia retrasada del interruptor: dicta qué opciones se pintan, y va un paso
  // por detrás para dar tiempo a que las no disponibles se desvanezcan.
  const [displayCaffeine, setDisplayCaffeine] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setType('espresso');
    setHasCaffeine(true);
    setDisplayCaffeine(true);
    setLeaving(false);
  }, [open]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  const handleCaffeineChange = (checked: boolean) => {
    setHasCaffeine(checked);
    // La energética, los tés, la cola... solo existen en su estado de cafeína.
    if (!coffeeTypesFor(checked).includes(type)) setType('espresso');
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setLeaving(true);
    swapTimer.current = setTimeout(() => {
      setDisplayCaffeine(checked);
      setLeaving(false);
    }, SWAP_MS);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ type, hasCaffeine });
    } finally {
      setSaving(false);
    }
  };

  const availableTypes = coffeeTypesFor(displayCaffeine);

  return (
    <Modal open={open} title="¿Qué has tomado?" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-coffee-700">Tipo de café</p>
          <div className="flex flex-col">
            {TYPE_GROUPS.map((group, groupIndex) => {
              const groupTypes = group.filter((value) => availableTypes.includes(value));
              if (groupTypes.length === 0) return null;
              // Los grupos 2 y 3 son los que entran y salen con el interruptor.
              const swappable = groupIndex > 0;
              return (
                <div key={groupIndex}>
                  {groupIndex > 0 && <div className="my-2.5 h-px bg-coffee-100" />}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {groupTypes.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setType(value)}
                        disabled={swappable && leaving}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          type === value
                            ? 'border-coffee-600 bg-coffee-50 text-coffee-900'
                            : 'border-coffee-200 text-coffee-600 hover:bg-coffee-50'
                        } ${swappable && leaving ? 'scale-90 opacity-0' : ''} ${
                          swappable && !leaving ? 'animate-pop' : ''
                        }`}
                      >
                        <CoffeeTypeIcon type={value} className="size-5" />
                        {COFFEE_TYPE_LABELS[value]}
                        {COFFEE_TYPE_VALUES[value] !== 1 && (
                          <span className="text-[10px] leading-none text-coffee-400">
                            vale {formatNumber(COFFEE_TYPE_VALUES[value])}{' '}
                            {coffeeLabel(COFFEE_TYPE_VALUES[value])}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Toggle
          checked={hasCaffeine}
          onChange={handleCaffeineChange}
          label="Con cafeína"
          description="Desactiva si era descafeinado."
          activeLabel="Con cafeína"
          inactiveLabel="Sin cafeína"
          activeIcon={<Zap className="size-4" aria-hidden />}
          inactiveIcon={<ZapOff className="size-4" aria-hidden />}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            Registrar café
          </Button>
        </div>
      </div>
    </Modal>
  );
}
