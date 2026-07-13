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
import type { DailySeriesPoint } from '@/types/group';

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

const dayLabelFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

interface Member {
  userId: string;
  name: string;
  color: string;
}

interface GroupDailyChartProps {
  points: DailySeriesPoint[];
  /** Usuario actual, para resaltar su línea. */
  currentUserId: string | null;
}

/** Gráfico de líneas: cafeína (mg) día a día de cada miembro del grupo. */
export function GroupDailyChart({ points, currentUserId }: GroupDailyChartProps) {
  const { data, members } = useMemo(() => {
    const memberMap = new Map<string, Member>();
    const dayMap = new Map<string, Record<string, number | string>>();

    for (const point of points) {
      if (!memberMap.has(point.userId)) {
        const index = memberMap.size;
        memberMap.set(point.userId, {
          userId: point.userId,
          name: point.displayName || point.username,
          color: SERIES_COLORS[index % SERIES_COLORS.length] ?? chartColors.coffee,
        });
      }
      let row = dayMap.get(point.day);
      if (!row) {
        row = { day: dayLabelFormat.format(dateKeyToDate(point.day)) };
        dayMap.set(point.day, row);
      }
      row[point.userId] = point.mg;
    }

    const sortedDays = [...dayMap.keys()].sort((a, b) => a.localeCompare(b));
    return {
      data: sortedDays.map((key) => dayMap.get(key) as Record<string, number | string>),
      members: [...memberMap.values()],
    };
  }, [points]);

  if (members.length === 0 || data.length === 0) {
    return <p className="text-sm text-coffee-400">Aún no hay datos que comparar.</p>;
  }

  // Con muchos días, muestra menos etiquetas del eje X para que no se amontonen.
  const tickInterval = Math.max(0, Math.floor(data.length / 12));

  return (
    <ResponsiveContainer width="100%" height={340}>
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
