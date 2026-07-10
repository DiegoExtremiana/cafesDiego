import type { ReactNode } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Texto que sustituye a `label` cuando está activado; anima el cambio con `inactiveLabel`. */
  activeLabel?: string;
  /** Texto que sustituye a `label` cuando está desactivado. */
  inactiveLabel?: string;
  /** Icono que sustituye al activar; se transforma con `inactiveIcon` al cambiar de estado. */
  activeIcon?: ReactNode;
  /** Icono que se muestra al desactivar. */
  inactiveIcon?: ReactNode;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  activeLabel,
  inactiveLabel,
  activeIcon,
  inactiveIcon,
}: ToggleProps) {
  const hasLabelSwap = activeLabel !== undefined && inactiveLabel !== undefined;
  const hasIconSwap = activeIcon !== undefined && inactiveIcon !== undefined;

  return (
    <label
      className={`flex items-center justify-between gap-4 py-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
    >
      <span className="flex items-center gap-2.5">
        {hasIconSwap && (
          <span className="relative inline-flex size-5 shrink-0 items-center justify-center text-coffee-500">
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                checked ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'
              }`}
            >
              {activeIcon}
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                checked ? '-rotate-180 opacity-0' : 'rotate-0 opacity-100'
              }`}
            >
              {inactiveIcon}
            </span>
          </span>
        )}
        <span>
          {hasLabelSwap ? (
            // Grid apilado: ambas etiquetas ocupan la misma celda, así el
            // contenedor toma el ancho de la más larga (con absolute colapsaría a 0).
            <span className="grid h-5 overflow-hidden text-sm font-medium text-coffee-900">
              <span
                className={`col-start-1 row-start-1 whitespace-nowrap transition-all duration-300 ${
                  checked ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
              >
                {activeLabel}
              </span>
              <span
                className={`col-start-1 row-start-1 whitespace-nowrap transition-all duration-300 ${
                  checked ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
              >
                {inactiveLabel}
              </span>
            </span>
          ) : (
            <span className="block text-sm font-medium text-coffee-900">{label}</span>
          )}
          {description && <span className="block text-xs text-coffee-400">{description}</span>}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-coffee-600' : 'bg-coffee-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </label>
  );
}
