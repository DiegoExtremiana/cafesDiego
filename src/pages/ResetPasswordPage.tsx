import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordPage() {
  const { session, loading, passwordRecovery, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner label="Comprobando enlace..." />
      </main>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <Alert variant="success">Contraseña actualizada. Ya puedes usarla para iniciar sesión.</Alert>
        <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/panel', { replace: true })}>
          Ir al panel
        </Button>
      </AuthShell>
    );
  }

  if (!session || !passwordRecovery) {
    return (
      <AuthShell>
        <h1 className="mb-1 text-lg font-bold text-coffee-900">Enlace no válido</h1>
        <p className="mb-5 text-sm text-coffee-400">
          Para cambiar la contraseña abre el enlace que te hemos enviado por correo. Si ha caducado,
          pide uno nuevo.
        </p>
        <Link
          to="/recuperar"
          className="block rounded-xl bg-coffee-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-coffee-700"
        >
          Solicitar enlace
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mb-1 text-lg font-bold text-coffee-900">Nueva contraseña</h1>
      <p className="mb-5 text-sm text-coffee-400">
        Elige la contraseña nueva para {session.user.email}.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
        />
        <Input
          label="Repetir contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" size="lg" loading={submitting}>
          {!submitting && <KeyRound className="size-4" aria-hidden />}
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  );
}
