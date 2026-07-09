import { supabase } from '@/lib/supabase';

/** Comprueba si un nombre de usuario está libre (vía RPC, sortea la RLS de perfiles privados). */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_available', {
    check_username: username,
  });
  if (error) throw new Error(`No se pudo comprobar el nombre de usuario: ${error.message}`);
  return data;
}

/** Comprueba si un correo ya tiene una cuenta registrada. */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('email_registered', { check_email: email });
  if (error) throw new Error(`No se pudo comprobar el correo: ${error.message}`);
  return data;
}
