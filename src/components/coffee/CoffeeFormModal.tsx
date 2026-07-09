import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  combineDateAndTime,
  dateInputValue,
  timeInputValue,
} from '@/utils/dates';
import type { Coffee } from '@/types/coffee';

interface CoffeeFormModalProps {
  open: boolean;
  /** Café a editar; null para añadir uno nuevo. */
  coffee: Coffee | null;
  /** Fecha por defecto al añadir (por ejemplo, el día visible en el historial). */
  defaultDate?: Date;
  onClose: () => void;
  onSubmit: (takenAt: Date) => Promise<void>;
}

export function CoffeeFormModal({
  open,
  coffee,
  defaultDate,
  onClose,
  onSubmit,
}: CoffeeFormModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    const base = coffee?.takenAt ?? defaultDate ?? new Date();
    setDate(dateInputValue(base));
    setTime(coffee ? timeInputValue(coffee.takenAt) : timeInputValue(new Date()));
    setError(null);
  }, [open, coffee, defaultDate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const takenAt = combineDateAndTime(date, time);
    if (takenAt.getTime() > Date.now()) {
      setError('No puedes registrar un café en el futuro.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(takenAt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el café.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={coffee ? 'Editar café' : 'Añadir café'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Fecha"
          type="date"
          value={date}
          max={dateInputValue(new Date())}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <Input
          label="Hora"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {coffee ? 'Guardar cambios' : 'Añadir café'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
