import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Cigarette, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CoffeeList } from '@/components/coffee/CoffeeList';
import { CoffeeFormModal } from '@/components/coffee/CoffeeFormModal';
import { CigaretteList } from '@/components/cigarette/CigaretteList';
import { CigaretteFormModal } from '@/components/cigarette/CigaretteFormModal';
import { useAuth } from '@/hooks/useAuth';
import { useCoffees } from '@/hooks/useCoffees';
import { useCigarettes } from '@/hooks/useCigarettes';
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
import { cigaretteLabel } from '@/utils/cigarettes';
import type { Coffee, CoffeeDetails } from '@/types/coffee';
import type { Cigarette as CigaretteEntry } from '@/types/cigarette';

export default function HistoryPage() {
  const { profile } = useAuth();
  const { coffees, loading, error, addCoffee, editCoffee, updateCoffeeDetails, removeCoffee } =
    useCoffees();
  const { cigarettes, addCigarette, editCigarette, removeCigarette } = useCigarettes();
  const cigarettesEnabled = profile?.cigarettesEnabled ?? false;
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coffee | null>(null);
  const [deleting, setDeleting] = useState<Coffee | null>(null);
  const [cigFormOpen, setCigFormOpen] = useState(false);
  const [editingCig, setEditingCig] = useState<CigaretteEntry | null>(null);
  const [deletingCig, setDeletingCig] = useState<CigaretteEntry | null>(null);

  const dayCoffees = useMemo(
    () => coffees.filter((coffee) => isSameDay(coffee.takenAt, selectedDate)),
    [coffees, selectedDate],
  );
  const dayCigarettes = useMemo(
    () => cigarettes.filter((cigarette) => isSameDay(cigarette.smokedAt, selectedDate)),
    [cigarettes, selectedDate],
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

  const openAddCig = () => {
    setEditingCig(null);
    setCigFormOpen(true);
  };

  const openEditCig = (cigarette: CigaretteEntry) => {
    setEditingCig(cigarette);
    setCigFormOpen(true);
  };

  const handleCigSubmit = async (smokedAt: Date) => {
    if (editingCig) {
      await editCigarette(editingCig.id, smokedAt);
    } else {
      await addCigarette(smokedAt);
    }
  };

  const handleCigDelete = async () => {
    if (!deletingCig) return;
    await removeCigarette(deletingCig.id);
    setDeletingCig(null);
  };

  if (loading) return <Spinner label="Cargando historial..." />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-coffee-900">Historial</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden />
            Añadir bebida
          </Button>
          {cigarettesEnabled && (
            <Button variant="secondary" onClick={openAddCig}>
              <Cigarette className="size-4" aria-hidden />
              Añadir cigarro
            </Button>
          )}
        </div>
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

      {cigarettesEnabled && (
        <Card>
          <CardHeader
            title="Cigarros"
            subtitle={`${dayCigarettes.length} ${cigaretteLabel(dayCigarettes.length)}`}
            icon={<Cigarette className="size-4" aria-hidden />}
          />
          <CigaretteList
            cigarettes={dayCigarettes}
            onEdit={openEditCig}
            onDelete={setDeletingCig}
          />
        </Card>
      )}

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

      <CigaretteFormModal
        open={cigFormOpen}
        cigarette={editingCig}
        defaultDate={selectedDate}
        onClose={() => setCigFormOpen(false)}
        onSubmit={handleCigSubmit}
      />

      <ConfirmDialog
        open={deletingCig !== null}
        title="Eliminar cigarro"
        message={
          deletingCig
            ? `¿Seguro que quieres eliminar el cigarro de las ${formatTime(deletingCig.smokedAt)} del ${toDateKey(deletingCig.smokedAt)}?`
            : ''
        }
        onConfirm={handleCigDelete}
        onCancel={() => setDeletingCig(null)}
      />
    </div>
  );
}
