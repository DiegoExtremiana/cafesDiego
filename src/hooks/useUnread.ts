import { useContext } from 'react';
import { UnreadContext, type UnreadContextValue } from '@/contexts/UnreadContext';

export function useUnread(): UnreadContextValue {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread debe usarse dentro de <UnreadProvider>');
  }
  return context;
}
