import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Zap, ZapOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CoffeeTypeIcon } from './CoffeeTypeIcon';
import {
  caffeineMg,
  COFFEE_TYPE_LABELS,
  coffeeTypesFor,
  type CoffeeDetails,
  type CoffeeType,
} from '@/types/coffee';

interface CoffeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CoffeeDetails) => Promise<void>;
}

/**
 * Grupos desplegables del selector, cada uno con su separador-botón.
 * Solo "Café" empieza desplegado (la ventana sería muy larga en móvil);
 * los grupos 2 y 3 además dependen del estado del interruptor de cafeína.
 */
const TYPE_GROUPS: { label: string; types: CoffeeType[] }[] = [
  { label: 'Café', types: ['espresso', 'americano', 'cortado', 'capuchino', 'latte', 'otro'] },
  { label: 'Té', types: ['te_negro', 'te_verde', 'matcha', 'infusion'] },
  { label: 'Bebidas', types: ['energetica', 'cola', 'zumo', 'leche', 'cerveza'] },
];

const INITIAL_EXPANDED: Record<string, boolean> = { Café: true, Té: false, Bebidas: false };

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>(INITIAL_EXPANDED);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setType('espresso');
    setHasCaffeine(true);
    setDisplayCaffeine(true);
    setLeaving(false);
    setExpanded(INITIAL_EXPANDED);
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

        <div>
          <p className="mb-2 text-sm font-medium text-coffee-700">Tipo de bebida</p>
          <div className="flex flex-col">
            {TYPE_GROUPS.map((group, groupIndex) => {
              const groupTypes = group.types.filter((value) => availableTypes.includes(value));
              if (groupTypes.length === 0) return null;
              // Los grupos 2 y 3 son los que entran y salen con el interruptor.
              const swappable = groupIndex > 0;
              const isOpen = expanded[group.label] ?? false;
              return (
                <div key={group.label}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setExpanded((current) => ({ ...current, [group.label]: !isOpen }))
                    }
                    className={`mb-2 flex w-full items-center gap-2 rounded-lg py-1 transition-colors hover:bg-coffee-50 ${
                      groupIndex > 0 ? 'mt-1.5' : ''
                    }`}
                  >
                    <span className="h-px flex-1 bg-coffee-100" />
                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-coffee-400">
                      {group.label}
                      <ChevronDown
                        className={`size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </span>
                    <span className="h-px flex-1 bg-coffee-100" />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-3">
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
                            <span className="text-[10px] leading-none text-coffee-400">
                              {caffeineMg({ type: value, hasCaffeine })} mg
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            Registrar bebida
          </Button>
        </div>
      </div>
    </Modal>
  );
}
