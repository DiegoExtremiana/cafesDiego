import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { combineDateAndTime, dateInputValue, timeInputValue } from '@/utils/dates';
import type { Cigarette } from '@/types/cigarette';

interface CigaretteFormModalProps {
  open: boolean;
  /** Cigarro a editar; null para añadir uno nuevo. */
  cigarette: Cigarette | null;
  /** Fecha por defecto al añadir (por ejemplo, el día visible en el historial). */
  defaultDate?: Date;
  onClose: () => void;
  onSubmit: (smokedAt: Date) => Promise<void>;
}

export function CigaretteFormModal({
  open,
  cigarette,
  defaultDate,
  onClose,
  onSubmit,
}: CigaretteFormModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    const base = cigarette?.smokedAt ?? defaultDate ?? new Date();
    setDate(dateInputValue(base));
    setTime(cigarette ? timeInputValue(cigarette.smokedAt) : timeInputValue(new Date()));
    setError(null);
  }, [open, cigarette, defaultDate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const smokedAt = combineDateAndTime(date, time);
    if (smokedAt.getTime() > Date.now()) {
      setError('No puedes registrar un cigarro en el futuro.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(smokedAt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cigarro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={cigarette ? 'Editar cigarro' : 'Añadir cigarro'} onClose={onClose}>
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
            {cigarette ? 'Guardar cambios' : 'Añadir cigarro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
