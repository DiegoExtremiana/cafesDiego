import { Check, Loader2, X } from 'lucide-react';

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';

interface AvailabilityHintProps {
  status: AvailabilityStatus;
  takenMessage: string;
  availableMessage: string;
}

/** Mensaje de disponibilidad en tiempo real para campos únicos (username, email). */
export function AvailabilityHint({ status, takenMessage, availableMessage }: AvailabilityHintProps) {
  if (status === 'idle') return null;
  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${
        status === 'available'
          ? 'text-emerald-600'
          : status === 'taken'
            ? 'text-red-600'
            : 'text-coffee-400'
      }`}
    >
      {status === 'checking' && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Comprobando disponibilidad...
        </>
      )}
      {status === 'available' && (
        <>
          <Check className="size-3.5" aria-hidden />
          {availableMessage}
        </>
      )}
      {status === 'taken' && (
        <>
          <X className="size-3.5" aria-hidden />
          {takenMessage}
        </>
      )}
    </p>
  );
}
