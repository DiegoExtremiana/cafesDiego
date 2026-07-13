import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { axisTick, chartColors, tooltipStyle } from '@/components/charts/theme';
import { dateKeyToDate } from '@/utils/dates';
import type { DailySeriesPoint } from '@/types/group';

/** Paleta para las líneas de cada miembro (se cicla si hay más miembros). */
export const SERIES_COLORS = [
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

export interface ChartMember {
  userId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

/** Deriva los miembros (con color estable) de la serie, en orden de aparición. */
export function buildChartMembers(points: DailySeriesPoint[]): ChartMember[] {
  const map = new Map<string, ChartMember>();
  for (const point of points) {
    if (!map.has(point.userId)) {
      const index = map.size;
      map.set(point.userId, {
        userId: point.userId,
        name: point.displayName || point.username,
        color: SERIES_COLORS[index % SERIES_COLORS.length] ?? chartColors.coffee,
        avatarUrl: point.avatarUrl,
      });
    }
  }
  return [...map.values()];
}

const dayLabelFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

interface GroupDailyChartProps {
  points: DailySeriesPoint[];
  /** Usuario actual, para resaltar su línea. */
  currentUserId: string | null;
  /** Miembros con color; si no se pasan, se derivan de los puntos. */
  members?: ChartMember[];
}

/** Gráfico de líneas: cafeína (mg) día a día de cada miembro del grupo. */
export function GroupDailyChart({ points, currentUserId, members }: GroupDailyChartProps) {
  const chartMembers = useMemo(() => members ?? buildChartMembers(points), [members, points]);

  const data = useMemo(() => {
    const dayMap = new Map<string, Record<string, number | string>>();
    for (const point of points) {
      let row = dayMap.get(point.day);
      if (!row) {
        row = { day: dayLabelFormat.format(dateKeyToDate(point.day)) };
        dayMap.set(point.day, row);
      }
      row[point.userId] = point.mg;
    }
    return [...dayMap.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((key) => dayMap.get(key) as Record<string, number | string>);
  }, [points]);

  if (chartMembers.length === 0 || data.length === 0) {
    return <p className="text-sm text-coffee-400">Aún no hay datos que comparar.</p>;
  }

  // Con muchos días, muestra menos etiquetas del eje X para que no se amontonen.
  const tickInterval = Math.max(0, Math.floor(data.length / 12));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: chartColors.grid }}
          interval={tickInterval}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          unit=" mg"
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} mg`, '']} />
        {chartMembers.map((member) => {
          const isMe = member.userId === currentUserId;
          return (
            <Line
              key={member.userId}
              type="monotone"
              dataKey={member.userId}
              name={isMe ? `${member.name} (tú)` : member.name}
              stroke={member.color}
              strokeWidth={isMe ? 3.5 : 2}
              dot={false}
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
