import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y rellena los valores de tu proyecto Supabase.',
  );
}

// El hash se lee antes de crear el cliente: Supabase lo vacía al procesar el
// enlace del correo y HashRouter lo confundiría con una ruta.
const initialHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

/** La app se ha abierto desde el enlace de «recuperar contraseña». */
export const openedFromRecoveryLink = initialHash.get('type') === 'recovery';

/** Supabase añade este parámetro al enlace si ha caducado o ya se usó. */
export const authLinkErrorCode = initialHash.get('error_code') ?? initialHash.get('error');

// La sesión se guarda en localStorage y el token se renueva solo: la sesión
// se mantiene hasta que el usuario cierra sesión (no expira por recargar ni
// por cerrar la PWA). Son los valores por defecto, explícitos para blindarlos.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
