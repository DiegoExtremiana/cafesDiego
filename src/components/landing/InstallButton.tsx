import { useState } from 'react';
import { Download, Share } from 'lucide-react';

// APK publicado por el workflow "Compilar APK Android" en GitHub Releases
// (tag fijo android-latest → URL estable que se sobrescribe en cada build).
const APK_URL =
  'https://github.com/DiegoExtremiana/cafesDiego/releases/download/android-latest/app-debug.apk';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

const BTN =
  'flex items-center gap-2 rounded-xl border border-coffee-200 bg-white px-6 py-3 text-base font-medium text-coffee-800 shadow-sm transition-colors hover:bg-coffee-50';

/**
 * Botón "Descargar app" para la landing (antes de login/registro).
 * - Android: descarga directa del APK (incluye el widget de escritorio).
 * - iOS: no hay APK; muestra cómo añadir a la pantalla de inicio (PWA).
 * - Escritorio o ya instalada: no se muestra.
 */
export function InstallButton() {
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed] = useState(() => isStandalone());

  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  if (installed) return null;

  if (isAndroid) {
    return (
      <a href={APK_URL} className={BTN}>
        <Download className="size-4" aria-hidden />
        Descargar app
      </a>
    );
  }

  if (isIOS) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" onClick={() => setShowIosHelp((v) => !v)} className={BTN}>
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

  return null;
}
