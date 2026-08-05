import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isIos, isStandalone, type BeforeInstallPromptEvent } from '@/utils/pwa';

/**
 * Instala la app como PWA (sin la barra de direcciones ni el resto del marco
 * del navegador). En Android/Chrome usa el prompt nativo; en iOS Safari no
 * existe ese API, así que se muestran los pasos manuales de "Compartir ->
 * Añadir a pantalla de inicio". Se oculta por completo si ya está instalada.
 */
export function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (installed) return;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  if (installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt && !isIos()) return null;

  return (
    <Card>
      <CardHeader
        title="Instalar app"
        subtitle="Ábrela como app propia, sin la barra del navegador"
        icon={<SquarePlus className="size-4" aria-hidden />}
      />
      {deferredPrompt ? (
        <Button type="button" variant="secondary" onClick={handleInstall}>
          <Download className="size-4" aria-hidden />
          Instalar en el dispositivo
        </Button>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowIosHelp((v) => !v)}>
            <Download className="size-4" aria-hidden />
            Cómo instalar
          </Button>
          {showIosHelp && (
            <p className="max-w-sm rounded-xl bg-coffee-50 px-3 py-2 text-xs text-coffee-600">
              Toca <Share className="mb-0.5 inline size-3.5" aria-hidden /> Compartir y luego{' '}
              <strong>Añadir a pantalla de inicio</strong>.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
