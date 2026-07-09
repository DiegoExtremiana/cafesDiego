/** Traduce los errores más comunes de Supabase Auth a mensajes en español. */
export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (normalized.includes('user already registered')) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (normalized.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  }
  if (normalized.includes('unable to validate email') || normalized.includes('invalid email')) {
    return 'El correo electrónico no es válido.';
  }
  return `Error de autenticación: ${message}`;
}
