import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AvailabilityHint, type AvailabilityStatus } from '@/components/ui/AvailabilityHint';
import { useAuth } from '@/hooks/useAuth';
import { isEmailRegistered, isUsernameAvailable } from '@/services/availabilityService';

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHECK_DEBOUNCE_MS = 500;

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

  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>('idle');
  const usernameCheckId = useRef(0);
  const emailCheckId = useRef(0);

  useEffect(() => {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const id = ++usernameCheckId.current;
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(normalized);
        if (usernameCheckId.current === id) setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        if (usernameCheckId.current === id) setUsernameStatus('idle');
      }
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    const id = ++emailCheckId.current;
    const timer = setTimeout(async () => {
      try {
        const registered = await isEmailRegistered(normalized);
        if (emailCheckId.current === id) setEmailStatus(registered ? 'taken' : 'available');
      } catch {
        if (emailCheckId.current === id) setEmailStatus('idle');
      }
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [email]);

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
        navigate('/panel', { replace: true });
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

  const blocked = usernameStatus === 'taken' || emailStatus === 'taken';

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
        <div className="flex flex-col gap-1.5">
          <Input
            label="Nombre de usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="diegoextremiana"
            hint="Será la URL de tu perfil público: /u/tu-usuario"
            autoComplete="username"
            required
          />
          <AvailabilityHint
            status={usernameStatus}
            takenMessage="Ese nombre de usuario ya está en uso"
            availableMessage="Nombre de usuario disponible"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
          />
          <AvailabilityHint
            status={emailStatus}
            takenMessage="Ya existe una cuenta con este correo"
            availableMessage="Correo disponible"
          />
        </div>
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
        <Button type="submit" size="lg" loading={submitting} disabled={blocked}>
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
