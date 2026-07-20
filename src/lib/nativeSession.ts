import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Espeja la sesión de Supabase a almacenamiento nativo (Preferences) para que
 * el widget de escritorio pueda registrar cafés con la MISMA API sin abrir la
 * app. En web es un no-op (isNativePlatform() === false): la PWA no cambia.
 */
export function initNativeSessionBridge(): void {
  if (!Capacitor.isNativePlatform()) return;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const sync = async (session: Session | null) => {
    if (!session) {
      await Promise.all(
        ['sb_access_token', 'sb_refresh_token', 'sb_user_id'].map((k) =>
          Preferences.remove({ key: k }),
        ),
      );
      return;
    }
    await Preferences.set({ key: 'sb_url', value: url });
    await Preferences.set({ key: 'sb_key', value: key });
    await Preferences.set({ key: 'sb_access_token', value: session.access_token });
    await Preferences.set({ key: 'sb_refresh_token', value: session.refresh_token });
    await Preferences.set({ key: 'sb_user_id', value: session.user.id });
  };

  void supabase.auth.getSession().then(({ data }) => sync(data.session));
  supabase.auth.onAuthStateChange((_event, session) => void sync(session));
}
