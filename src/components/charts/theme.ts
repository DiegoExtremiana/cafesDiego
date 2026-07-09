/** Estilo compartido de los gráficos Recharts. */
import type { CSSProperties } from 'react';

export const chartColors = {
  coffee: '#9c6f44',
  coffeeDark: '#6b472c',
  coffeeLight: '#c9a888',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  grid: 'rgba(133, 90, 53, 0.22)',
};

export const tooltipStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-coffee-100)',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(70, 48, 31, 0.1)',
  fontSize: '12px',
  color: 'var(--color-coffee-900)',
};

export const axisTick = { fontSize: 11, fill: '#b08962' };
