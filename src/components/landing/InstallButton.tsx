import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

// El evento no está en las libs estándar de TS.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Botón "Instalar app" para la landing (antes de login/registro).
 * - Android/Chrome: dispara el prompt nativo de instalación.
 * - iOS/Safari: no hay prompt; muestra las instrucciones de "Añadir a inicio".
 * - Si ya está instalada (standalone) o el navegador no puede instalar, no se muestra.
 */
export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (installed) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  if (installed) return null;
  // Solo cuando es instalable: Android/Chrome (promptEvent) o iOS/Safari.
  if (!promptEvent && !isIOS) return null;

  const handleClick = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      setPromptEvent(null);
      return;
    }
    setShowIosHelp((v) => !v);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-xl border border-coffee-200 bg-white px-6 py-3 text-base font-medium text-coffee-800 shadow-sm transition-colors hover:bg-coffee-50"
      >
        <Download className="size-4" aria-hidden />
        Instalar app
      </button>
      {showIosHelp && (
        <p className="max-w-xs rounded-xl bg-coffee-50 px-3 py-2 text-xs text-coffee-600">
          En iPhone/iPad: toca <Share className="mb-0.5 inline size-3.5" aria-hidden /> Compartir y
          luego <strong>Añadir a pantalla de inicio</strong>.
        </p>
      )}
    </div>
  );
}
