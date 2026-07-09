import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError(
        'El nombre de usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.',
      );
      return;
    }
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
      const { needsEmailConfirmation } = await signUp(
        email.trim(),
        password,
        normalizedUsername,
        displayName.trim(),
      );
      if (needsEmailConfirmation) {
        setPendingConfirmation(true);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingConfirmation) {
    return (
      <AuthShell>
        <Alert variant="success">
          Cuenta creada. Revisa tu correo y confirma tu dirección para poder iniciar sesión.
        </Alert>
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
      <h1 className="mb-1 text-lg font-bold text-coffee-900">Crear cuenta</h1>
      <p className="mb-5 text-sm text-coffee-400">Empieza a registrar tus cafés hoy mismo.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Diego"
          autoComplete="name"
          required
        />
        <Input
          label="Nombre de usuario"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="diegoextremiana"
          hint="Será la URL de tu perfil público: /u/tu-usuario"
          autoComplete="username"
          required
        />
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
        <Input
          label="Contraseña"
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
          {!submitting && <UserPlus className="size-4" aria-hidden />}
          Crear cuenta
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-coffee-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-coffee-700 underline-offset-2 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
