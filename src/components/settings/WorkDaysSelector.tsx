const DAYS = [
  { value: 1, label: 'L', name: 'Lunes' },
  { value: 2, label: 'M', name: 'Martes' },
  { value: 3, label: 'X', name: 'Miércoles' },
  { value: 4, label: 'J', name: 'Jueves' },
  { value: 5, label: 'V', name: 'Viernes' },
  { value: 6, label: 'S', name: 'Sábado' },
  { value: 7, label: 'D', name: 'Domingo' },
];

interface WorkDaysSelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
}

/** Selector de días laborables (formato ISO: 1 = lunes ... 7 = domingo). */
export function WorkDaysSelector({ value, onChange }: WorkDaysSelectorProps) {
  const toggle = (day: number) => {
    onChange(
      value.includes(day)
        ? value.filter((selected) => selected !== day)
        : [...value, day].sort((a, b) => a - b),
    );
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-coffee-800">Días laborables</span>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DAYS.map((day) => {
          const selected = value.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggle(day.value)}
              aria-pressed={selected}
              aria-label={day.name}
              title={day.name}
              className={`aspect-square w-full min-w-0 rounded-xl text-sm font-medium transition-colors ${
                selected
                  ? 'bg-coffee-600 text-white shadow-sm'
                  : 'bg-coffee-100 text-coffee-500 hover:bg-coffee-200'
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
