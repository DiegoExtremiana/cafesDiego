import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="mb-1 text-lg font-bold text-coffee-900">Iniciar sesión</h1>
      <p className="mb-5 text-sm text-coffee-400">Bienvenido de nuevo. Tu café te espera.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" size="lg" loading={submitting}>
          {!submitting && <LogIn className="size-4" aria-hidden />}
          Entrar
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-coffee-500">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-coffee-700 underline-offset-2 hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
