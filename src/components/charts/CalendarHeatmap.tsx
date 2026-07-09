import { useMemo } from 'react';
import { calendarData, calendarColor } from '@/utils/chartData';
import { formatDate, dateKeyToDate } from '@/utils/dates';
import { coffeeLabel } from '@/utils/format';
import type { Coffee } from '@/types/coffee';

const WEEKDAY_LABELS = ['L', '', 'X', '', 'V', '', 'D'];

interface CalendarHeatmapProps {
  coffees: Coffee[];
  now: Date;
}

/**
 * Calendario anual tipo GitHub: cada día se colorea según el número
 * de cafés (1-2 verde, 3 naranja, 4 o más rojo).
 */
export function CalendarHeatmap({ coffees, now }: CalendarHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => calendarData(coffees, now), [coffees, now]);

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
                <span
                  key={cell.dateKey}
                  title={
                    cell.inRange
                      ? `${formatDate(dateKeyToDate(cell.dateKey))}: ${cell.count} ${coffeeLabel(cell.count)}`
                      : undefined
                  }
                  className="size-[11px] rounded-[3px] transition-transform hover:scale-125"
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
          {[0, 1, 2, 3, 4].map((count) => (
            <span
              key={count}
              className="size-[11px] rounded-[3px]"
              style={{ backgroundColor: calendarColor(count) }}
            />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
