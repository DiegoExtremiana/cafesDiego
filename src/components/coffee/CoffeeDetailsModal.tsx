import { useEffect, useState } from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { CoffeeTypeIcon } from './CoffeeTypeIcon';
import { COFFEE_TYPES, COFFEE_TYPE_LABELS, type CoffeeDetails, type CoffeeType } from '@/types/coffee';

interface CoffeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CoffeeDetails) => Promise<void>;
}

/** Modal que se abre al mantener pulsado el botón de registro, para elegir tipo y cafeína. */
export function CoffeeDetailsModal({ open, onClose, onSubmit }: CoffeeDetailsModalProps) {
  const [type, setType] = useState<CoffeeType>('espresso');
  const [hasCaffeine, setHasCaffeine] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType('espresso');
    setHasCaffeine(true);
  }, [open]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ type, hasCaffeine });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="¿Qué has tomado?" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-coffee-700">Tipo de café</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COFFEE_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  type === value
                    ? 'border-coffee-600 bg-coffee-50 text-coffee-900'
                    : 'border-coffee-200 text-coffee-600 hover:bg-coffee-50'
                }`}
              >
                <CoffeeTypeIcon type={value} className="size-5" />
                {COFFEE_TYPE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          checked={hasCaffeine}
          onChange={setHasCaffeine}
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
