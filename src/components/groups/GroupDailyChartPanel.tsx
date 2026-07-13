import { useEffect, useMemo, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { buildChartMembers, GroupDailyChart } from './GroupDailyChart';
import type { DailySeriesPoint } from '@/types/group';

interface GroupDailyChartPanelProps {
  points: DailySeriesPoint[];
  currentUserId: string | null;
}

/**
 * Panel del gráfico del grupo: columna de miembros a la izquierda (scroll
 * vertical si hay muchos) y el gráfico a la derecha (scroll horizontal,
 * posicionado por defecto en el día de hoy, el extremo derecho).
 */
export function GroupDailyChartPanel({ points, currentUserId }: GroupDailyChartPanelProps) {
  const members = useMemo(() => buildChartMembers(points), [points]);
  const dayCount = useMemo(() => new Set(points.map((point) => point.day)).size, [points]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Coloca la vista en el día de hoy (extremo derecho) al cargar/actualizar.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, [points]);

  if (members.length === 0 || dayCount === 0) {
    return <p className="text-sm text-coffee-400">Aún no hay datos que comparar.</p>;
  }

  return (
    <div className="flex gap-3">
      <ul className="flex max-h-[320px] w-28 shrink-0 flex-col gap-1.5 overflow-y-auto pr-1 sm:w-36">
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          return (
            <li key={member.userId} className="flex items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: member.color }}
                aria-hidden
              />
              <Avatar
                user={{ displayName: member.name, avatarUrl: member.avatarUrl }}
                className="size-6 text-[10px]"
              />
              <span
                className={`truncate text-xs ${isMe ? 'font-semibold text-coffee-900' : 'text-coffee-600'}`}
                title={member.name}
              >
                {member.name}
                {isMe && ' (tú)'}
              </span>
            </li>
          );
        })}
      </ul>

      <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
        <div style={{ minWidth: Math.max(480, dayCount * 26) }}>
          <GroupDailyChart points={points} currentUserId={currentUserId} members={members} />
        </div>
      </div>
    </div>
  );
}
