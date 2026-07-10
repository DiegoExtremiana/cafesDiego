import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { tooltipStyle } from './theme';
import { formatNumber } from '@/utils/format';

export interface RingSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface RingChartProps {
  data: RingSegment[];
  height?: number;
  /** Texto grande mostrado en el centro del anillo. */
  centerValue?: string;
  /** Texto pequeño debajo del valor central. */
  centerLabel?: string;
}

/** Anillo de progreso con extremos redondeados, interactivo al pasar el ratón. */
export function RingChart({ data, height = 220, centerValue, centerLabel }: RingChartProps) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="70%"
            outerRadius="94%"
            startAngle={90}
            endAngle={-270}
            cornerRadius={10}
            paddingAngle={total > 0 ? 4 : 0}
            stroke="none"
            isAnimationActive
            animationDuration={600}
          >
            {data.map((segment) => (
              <Cell
                key={segment.key}
                fill={segment.color}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, label: string) => [formatNumber(value), label]}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-2xl font-bold text-coffee-900">{centerValue}</span>
          )}
          {centerLabel && <span className="text-xs text-coffee-400">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
