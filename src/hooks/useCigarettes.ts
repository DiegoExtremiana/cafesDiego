import { useContext } from 'react';
import { CigarettesContext, type CigarettesContextValue } from '@/contexts/CigarettesContext';

export function useCigarettes(): CigarettesContextValue {
  const context = useContext(CigarettesContext);
  if (!context) {
    throw new Error('useCigarettes debe usarse dentro de un CigarettesProvider.');
  }
  return context;
}
