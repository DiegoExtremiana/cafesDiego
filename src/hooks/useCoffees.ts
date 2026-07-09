import { useContext } from 'react';
import { CoffeesContext, type CoffeesContextValue } from '@/contexts/CoffeesContext';

export function useCoffees(): CoffeesContextValue {
  const context = useContext(CoffeesContext);
  if (!context) {
    throw new Error('useCoffees debe usarse dentro de <CoffeesProvider>');
  }
  return context;
}
