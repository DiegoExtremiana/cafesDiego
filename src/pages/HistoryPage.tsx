import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CoffeeList } from '@/components/coffee/CoffeeList';
import { CoffeeFormModal } from '@/components/coffee/CoffeeFormModal';
import { useCoffees } from '@/hooks/useCoffees';
import {
  addDays,
  dateInputValue,
  dateKeyToDate,
  formatDateLong,
  formatTime,
  isSameDay,
  startOfDay,
  toDateKey,
} from '@/utils/dates';
import type { Coffee, CoffeeDetails } from '@/types/coffee';

export default function HistoryPage() {
  const { coffees, loading, error, addCoffee, editCoffee, updateCoffeeDetails, removeCoffee } =
    useCoffees();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coffee | null>(null);
  const [deleting, setDeleting] = useState<Coffee | null>(null);

  const dayCoffees = useMemo(
    () => coffees.filter((coffee) => isSameDay(coffee.takenAt, selectedDate)),
    [coffees, selectedDate],
  );

  const isToday = isSameDay(selectedDate, new Date());

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (coffee: Coffee) => {
    setEditing(coffee);
    setFormOpen(true);
  };

  const handleSubmit = async (takenAt: Date) => {
    if (editing) {
      await editCoffee(editing.id, takenAt);
    } else {
      await addCoffee(takenAt);
    }
  };

  const handleUpdateDetails = (coffee: Coffee, details: CoffeeDetails) =>
    updateCoffeeDetails(coffee.id, details);

  const handleDelete = async () => {
    if (!deleting) return;
    await removeCoffee(deleting.id);
    setDeleting(null);
  };

  if (loading) return <Spinner label="Cargando historial..." />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-coffee-900">Historial</h1>
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden />
          Añadir bebida
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate((date) => addDays(date, -1))}
              aria-label="Día anterior"
              className="shrink-0 rounded-lg p-2 text-coffee-500 transition-colors hover:bg-coffee-100"
            >
              <ChevronLeft className="size-4.5" aria-hidden />
            </button>
            <label className="relative inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-coffee-200 px-3 py-1.5 text-sm text-coffee-800">
              <CalendarDays className="size-4 shrink-0 text-coffee-400" aria-hidden />
              <span className="min-w-0 truncate capitalize">{formatDateLong(selectedDate)}</span>
              <input
                type="date"
                value={dateInputValue(selectedDate)}
                max={dateInputValue(new Date())}
                onChange={(event) => {
                  if (event.target.value) setSelectedDate(dateKeyToDate(event.target.value));
                }}
                className="absolute inset-0 cursor-pointer text-base opacity-0"
                aria-label="Seleccionar fecha"
              />
            </label>
            <button
              type="button"
              onClick={() => setSelectedDate((date) => addDays(date, 1))}
              disabled={isToday}
              aria-label="Día siguiente"
              className="shrink-0 rounded-lg p-2 text-coffee-500 transition-colors hover:bg-coffee-100 disabled:opacity-40"
            >
              <ChevronRight className="size-4.5" aria-hidden />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-coffee-400">
              {dayCoffees.length} {dayCoffees.length === 1 ? 'café' : 'cafés'}
            </span>
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(startOfDay(new Date()))}
              >
                Hoy
              </Button>
            )}
          </div>
        </div>

        <CoffeeList
          coffees={dayCoffees}
          onEdit={openEdit}
          onDelete={setDeleting}
          onUpdateDetails={handleUpdateDetails}
        />
      </Card>

      <CoffeeFormModal
        open={formOpen}
        coffee={editing}
        defaultDate={selectedDate}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar bebida"
        message={
          deleting
            ? `¿Seguro que quieres eliminar el café de las ${formatTime(deleting.takenAt)} del ${toDateKey(deleting.takenAt)}?`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
