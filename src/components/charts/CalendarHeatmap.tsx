import { useMemo, useState } from 'react';
import { calendarData, calendarColor } from '@/utils/chartData';
import { formatDate, dateKeyToDate } from '@/utils/dates';
import { formatMg } from '@/utils/format';
import { ESPRESSO_MG, type Coffee } from '@/types/coffee';

const WEEKDAY_LABELS = ['L', '', 'X', '', 'V', '', 'D'];

interface CalendarHeatmapProps {
  coffees: Coffee[];
  now: Date;
}

interface ActiveCell {
  dateKey: string;
  count: number;
}

/**
 * Calendario anual tipo GitHub: cada día se colorea según el número
 * de cafés (1-2 verde, 3 naranja, 4 o más rojo). El detalle del día se
 * muestra al pasar el ratón o al tocar la celda (funciona en móvil/tablet,
 * donde no existe hover ni el atributo title nativo).
 */
export function CalendarHeatmap({ coffees, now }: CalendarHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => calendarData(coffees, now), [coffees, now]);
  const [active, setActive] = useState<ActiveCell | null>(null);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-fit">
        <div className="mb-1 grid grid-flow-col gap-[3px] pl-6 text-[10px] text-coffee-400">
          {weeks.map((_, index) => {
            const label = monthLabels.find((month) => month.index === index);
            return (
              <span key={index} className="w-[11px] overflow-visible whitespace-nowrap capitalize">
                {label && index <= weeks.length - 3 ? label.label : ''}
              </span>
            );
          })}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex w-5 flex-col gap-[3px] text-[9px] leading-[11px] text-coffee-400">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className="h-[11px]">
                {label}
              </span>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <button
                  key={cell.dateKey}
                  type="button"
                  disabled={!cell.inRange}
                  aria-label={
                    cell.inRange
                      ? `${formatDate(dateKeyToDate(cell.dateKey))}: ${formatMg(cell.count)} de cafeína`
                      : undefined
                  }
                  onMouseEnter={() => cell.inRange && setActive({ dateKey: cell.dateKey, count: cell.count })}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => cell.inRange && setActive({ dateKey: cell.dateKey, count: cell.count })}
                  onClick={() => cell.inRange && setActive({ dateKey: cell.dateKey, count: cell.count })}
                  className="size-[11px] rounded-[3px] transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-coffee-500 disabled:cursor-default"
                  style={{
                    backgroundColor: cell.inRange ? calendarColor(cell.count) : 'transparent',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 pl-6 text-[10px] text-coffee-400">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((espressos) => (
            <span
              key={espressos}
              className="size-[11px] rounded-[3px]"
              style={{ backgroundColor: calendarColor(espressos * ESPRESSO_MG) }}
            />
          ))}
          <span>Más</span>
        </div>
        <p className="mt-2 min-h-[1.1rem] pl-6 text-xs font-medium text-coffee-600">
          {active
            ? `${formatDate(dateKeyToDate(active.dateKey))}: ${formatMg(active.count)} de cafeína`
            : 'Pasa el cursor o toca un día para ver el detalle.'}
        </p>
      </div>
    </div>
  );
}
