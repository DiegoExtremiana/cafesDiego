import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { axisTick, chartColors, tooltipStyle } from '@/components/charts/theme';
import { dateKeyToDate } from '@/utils/dates';
import type { WeeklySeriesPoint } from '@/types/group';

/** Paleta para las líneas de cada miembro (se cicla si hay más miembros). */
const SERIES_COLORS = [
  chartColors.coffee,
  chartColors.green,
  chartColors.amber,
  '#3b82f6',
  chartColors.red,
  '#a855f7',
  '#14b8a6',
  '#ec4899',
  chartColors.coffeeDark,
  '#84cc16',
];

const weekLabelFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

interface Member {
  userId: string;
  name: string;
  color: string;
}

interface GroupComparisonChartProps {
  points: WeeklySeriesPoint[];
  /** Usuario actual, para resaltar su línea. */
  currentUserId: string | null;
}

/** Gráfico de líneas: cafeína (mg) semana a semana de cada miembro del grupo. */
export function GroupComparisonChart({ points, currentUserId }: GroupComparisonChartProps) {
  const { data, members } = useMemo(() => {
    const memberMap = new Map<string, Member>();
    const weekMap = new Map<string, Record<string, number | string>>();

    for (const point of points) {
      if (!memberMap.has(point.userId)) {
        const index = memberMap.size;
        memberMap.set(point.userId, {
          userId: point.userId,
          name: point.displayName || point.username,
          color: SERIES_COLORS[index % SERIES_COLORS.length] ?? chartColors.coffee,
        });
      }
      let row = weekMap.get(point.weekStart);
      if (!row) {
        row = { week: weekLabelFormat.format(dateKeyToDate(point.weekStart)) };
        weekMap.set(point.weekStart, row);
      }
      row[point.userId] = point.mg;
    }

    return {
      data: [...weekMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, row]) => row),
      members: [...memberMap.values()],
    };
  }, [points]);

  if (members.length === 0 || data.length === 0) {
    return <p className="text-sm text-coffee-400">Aún no hay datos que comparar.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={axisTick} tickLine={false} axisLine={{ stroke: chartColors.grid }} />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          unit=" mg"
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} mg`, '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          return (
            <Line
              key={member.userId}
              type="monotone"
              dataKey={member.userId}
              name={isMe ? `${member.name} (tú)` : member.name}
              stroke={member.color}
              strokeWidth={isMe ? 3.5 : 2}
              dot={{ r: 2.5, fill: member.color }}
              activeDot={{ r: 5 }}
              connectNulls
              animationDuration={500}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
