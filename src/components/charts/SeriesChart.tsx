import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesPoint } from '@/utils/chartData';
import { axisTick, chartColors, tooltipStyle } from './theme';

interface SeriesChartProps {
  data: SeriesPoint[];
  type?: 'bar' | 'area' | 'line';
  color?: string;
  height?: number;
  /** Nombre de la serie mostrado en el tooltip. */
  name?: string;
  /** Cada cuántas etiquetas del eje X se muestra una (0 = todas). */
  tickInterval?: number | 'preserveStartEnd';
}

/** Gráfico genérico animado para series de puntos {label, count}. */
export function SeriesChart({
  data,
  type = 'bar',
  color = chartColors.coffee,
  height = 240,
  name = 'Cafés',
  tickInterval = 'preserveStartEnd',
}: SeriesChartProps) {
  const commonAxes = (
    <>
      <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
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
        width={32}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(156, 111, 68, 0.08)' }} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'bar' ? (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {commonAxes}
          <Bar
            dataKey="count"
            name={name}
            fill={color}
            radius={[4, 4, 0, 0]}
            animationDuration={600}
          />
        </BarChart>
      ) : type === 'area' ? (
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {commonAxes}
          <Area
            type="monotone"
            dataKey="count"
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.18}
            animationDuration={600}
          />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {commonAxes}
          <Line
            type="monotone"
            dataKey="count"
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            animationDuration={600}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
