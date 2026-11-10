import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const location = useLocation();
  const linkExpired = (location.state as { linkExpired?: boolean } | null)?.linkExpired ?? false;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <Alert variant="success">
          Si existe una cuenta con {email.trim()}, recibirás un correo con un enlace para crear una
          contraseña nueva.
        </Alert>
        <p className="mt-4 text-sm text-coffee-500">
          Abre el enlace en este mismo dispositivo. Si no lo ves en unos minutos, revisa la carpeta
          de spam.
        </p>
        <p className="mt-5 text-center text-sm text-coffee-500">
          <Link to="/login" className="font-medium text-coffee-700 underline-offset-2 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mb-1 text-lg font-bold text-coffee-900">Recuperar contraseña</h1>
      <p className="mb-5 text-sm text-coffee-400">
        Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {linkExpired && (
          <Alert variant="error">El enlace ha caducado o ya se ha usado. Solicita uno nuevo.</Alert>
        )}
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" size="lg" loading={submitting}>
          {!submitting && <Mail className="size-4" aria-hidden />}
          Enviar enlace
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-coffee-500">
        ¿Ya la recuerdas?{' '}
        <Link to="/login" className="font-medium text-coffee-700 underline-offset-2 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
