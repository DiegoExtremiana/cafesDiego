import { useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-coffee-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-coffee-200 bg-white px-3.5 py-2.5 text-sm text-coffee-950 placeholder:text-coffee-300 transition-shadow focus:border-coffee-400 focus:shadow-[0_0_0_3px_rgba(156,111,68,0.15)] focus:outline-none disabled:bg-coffee-50 disabled:text-coffee-400 ${error ? 'border-red-400' : ''} ${className}`}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-coffee-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
