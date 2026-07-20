# Widget nativo Android (botón en el escritorio) — pasos para cuando empaquetes con Capacitor

El acceso directo PWA (Opción A) ya funciona hoy sin nada de esto. Este documento
es para el **widget-panel nativo real** (botón en el escritorio que registra un
café **sin abrir la app**). Requiere compilar con Capacitor.

El widget llama a la **misma API** (`POST /rest/v1/coffees` en Supabase) con el
token de sesión que la app espeja en `Preferences`. No duplica lógica: misma tabla,
mismo contrato, y la suscripción realtime de la web refleja el INSERT en vivo.

## Requisitos

- Android Studio + JDK 17 + Android SDK.
- Node ya instalado (el mismo del proyecto).

## 1. Instalar Capacitor y añadir Android

```bash
npm i @capacitor/core @capacitor/preferences
npm i -D @capacitor/cli @capacitor/android
npm run build            # genera dist/ (webDir de capacitor.config.json)
npx cap add android      # genera la carpeta android/
npx cap sync
```

`capacitor.config.json` ya está en la raíz (`appId: es.sdi.cafesdiego`, `webDir: dist`).
Al empaquetar así, el frontend viaja **dentro del APK**: la app no depende de
GitHub Pages para cargar la interfaz. La API y la BD siguen siendo Supabase.

## 2. Puente de sesión (para que el widget conozca el token)

Crea `src/lib/nativeSession.ts`:

```ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Espeja la sesión de Supabase a almacenamiento nativo para que el widget la lea.
// En web es un no-op (isNativePlatform() === false): la PWA no cambia.
export function initNativeSessionBridge() {
  if (!Capacitor.isNativePlatform()) return;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const sync = async (session: Session | null) => {
    if (!session) {
      for (const k of ['sb_access_token', 'sb_refresh_token', 'sb_user_id']) {
        await Preferences.remove({ key: k });
      }
      return;
    }
    await Preferences.set({ key: 'sb_url', value: url });
    await Preferences.set({ key: 'sb_key', value: key });
    await Preferences.set({ key: 'sb_access_token', value: session.access_token });
    await Preferences.set({ key: 'sb_refresh_token', value: session.refresh_token });
    await Preferences.set({ key: 'sb_user_id', value: session.user.id });
  };

  void supabase.auth.getSession().then(({ data }) => sync(data.session));
  supabase.auth.onAuthStateChange((_e, session) => void sync(session));
}
```

Y llámalo una vez en `src/main.tsx`, justo antes de `createRoot(...)`:

```ts
import { initNativeSessionBridge } from '@/lib/nativeSession';
initNativeSessionBridge();
```

> Nota: `@capacitor/preferences` guarda en el fichero SharedPreferences
> `CapacitorStorage` con la clave tal cual. El widget lee ese mismo fichero y
> esas mismas claves. Si usas una versión antigua con prefijo `_cap_`, ajusta
> las constantes `K_*` en `CoffeeWidgetProvider.kt`.

## 3. Copiar los archivos del widget al proyecto Android generado

Desde `native/android/` a `android/app/src/main/`:

| Origen (este repo)                     | Destino en android/                                        |
| -------------------------------------- | ---------------------------------------------------------- |
| `CoffeeWidgetProvider.kt`              | `app/src/main/java/es/sdi/cafesdiego/CoffeeWidgetProvider.kt` |
| `res/layout/coffee_widget.xml`         | `app/src/main/res/layout/coffee_widget.xml`                |
| `res/xml/coffee_widget_info.xml`       | `app/src/main/res/xml/coffee_widget_info.xml`              |

El paquete `es.sdi.cafesdiego` del `.kt` debe coincidir con el `appId`.

## 4. Registrar el widget en AndroidManifest.xml

En `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`:

```xml
<receiver
    android:name=".CoffeeWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/coffee_widget_info" />
</receiver>
```

La app ya necesita permiso de red (Capacitor lo incluye por defecto):
`<uses-permission android:name="android.permission.INTERNET" />`.

## 5. Compilar, instalar y añadir el widget

```bash
npm run build && npx cap sync
npx cap run android        # o abre android/ en Android Studio y ejecuta
```

En el móvil: **inicia sesión una vez en la app** (para espejar el token) →
mantén pulsado el escritorio → **Widgets** → arrastra **Contador de cafés** →
el botón "+ Café" registra un café sin abrir la app.

> Verifica en tu dispositivo: el código nativo no se compila en este entorno.
