import { useEffect } from 'react';

/**
 * Llama a `onActive` cuando la pestaña vuelve a estar visible o la ventana
 * recupera el foco. Útil para refrescar datos que pueden haber cambiado en el
 * servidor mientras la app estaba en segundo plano. `onActive` debe ser estable
 * (envuélvelo en useCallback).
 */
export function useVisibilityRefetch(onActive: () => void): void {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onActive();
    };
    window.addEventListener('focus', onActive);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', onActive);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onActive]);
}
