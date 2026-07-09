import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

interface ExpandableChartProps {
  title: string;
  subtitle?: string | undefined;
  icon?: ReactNode;
  className?: string;
  /** Gráfico mostrado en la tarjeta (rango recortado, p. ej. últimos 30 días). */
  children: ReactNode;
  /** Gráfico mostrado en la ventana ampliada (todo el histórico); por defecto el mismo que `children`. */
  expanded?: ReactNode;
  /** Ancho mínimo en px del gráfico ampliado, para forzar scroll horizontal si no cabe. */
  expandedMinWidth?: number | undefined;
}

/** Tarjeta de gráfico que, al pulsarla, abre una ventana modal con la versión ampliada. */
export function ExpandableChart({
  title,
  subtitle,
  icon,
  className,
  children,
  expanded,
  expandedMinWidth,
}: ExpandableChartProps) {
  const [open, setOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={`Ampliar gráfico: ${title}`}
        className={`cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-500 ${className ?? ''}`}
      >
        <CardHeader title={title} subtitle={subtitle} icon={icon} />
        {children}
      </Card>
      <Modal open={open} title={title} onClose={() => setOpen(false)} size="xl">
        <div className="-mx-2 overflow-x-auto px-2">
          <div style={expandedMinWidth ? { minWidth: expandedMinWidth } : undefined}>
            {expanded ?? children}
          </div>
        </div>
      </Modal>
    </>
  );
}
