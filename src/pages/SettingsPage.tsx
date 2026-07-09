import { useEffect, useState, type FormEvent } from 'react';
import {
  Briefcase,
  Check,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  User,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Toggle } from '@/components/ui/Toggle';
import { Spinner } from '@/components/ui/Spinner';
import { WorkDaysSelector } from '@/components/settings/WorkDaysSelector';
import { useAuth } from '@/hooks/useAuth';
import { useCoffees } from '@/hooks/useCoffees';
import { exportToCsv, exportToJson } from '@/utils/export';

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { coffees } = useCoffees();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [workStart, setWorkStart] = useState('07:00');
  const [workEnd, setWorkEnd] = useState('14:00');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxCoffees, setMaxCoffees] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showAdvancedStats, setShowAdvancedStats] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carga los valores actuales del perfil en el formulario.
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setWorkStart(profile.workStart);
    setWorkEnd(profile.workEnd);
    setWorkDays(profile.workDays);
    setMaxCoffees(profile.maxDailyCoffees !== null ? String(profile.maxDailyCoffees) : '');
    setIsPublic(profile.isPublic);
    setShowHistory(profile.showHistory);
    setShowCharts(profile.showCharts);
    setShowAchievements(profile.showAchievements);
    setShowAdvancedStats(profile.showAdvancedStats);
  }, [profile]);

  if (!profile) return <Spinner label="Cargando ajustes..." />;

  const publicUrl = `${window.location.origin}${window.location.pathname}#/u/${username}`;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError(
        'El nombre de usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.',
      );
      return;
    }
    if (workDays.length === 0) {
      setError('Selecciona al menos un día laborable.');
      return;
    }
    if (workEnd <= workStart) {
      setError('La hora de salida debe ser posterior a la de entrada.');
      return;
    }
    const parsedMax = maxCoffees.trim() === '' ? null : Number(maxCoffees);
    if (parsedMax !== null && (!Number.isInteger(parsedMax) || parsedMax < 1)) {
      setError('El máximo de cafés debe ser un número entero mayor que cero.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: normalizedUsername,
        workStart,
        workEnd,
        workDays,
        maxDailyCoffees: parsedMax,
        isPublic,
        showHistory,
        showCharts,
        showAchievements,
        showAdvancedStats,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-coffee-900">Ajustes</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Perfil" icon={<User className="size-4" aria-hidden />} />
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Diego"
            />
            <Input
              label="Nombre de usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              hint="Forma parte de la URL de tu perfil público."
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Jornada laboral"
            subtitle="Se usa para calcular las horas trabajadas y tu ritmo"
            icon={<Briefcase className="size-4" aria-hidden />}
          />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora de entrada"
                type="time"
                value={workStart}
                onChange={(event) => setWorkStart(event.target.value)}
                required
              />
              <Input
                label="Hora de salida"
                type="time"
                value={workEnd}
                onChange={(event) => setWorkEnd(event.target.value)}
                required
              />
            </div>
            <WorkDaysSelector value={workDays} onChange={setWorkDays} />
            <Input
              label="Máximo recomendado de cafés al día"
              type="number"
              min={1}
              max={20}
              value={maxCoffees}
              onChange={(event) => setMaxCoffees(event.target.value)}
              placeholder="Sin límite"
              hint="Déjalo vacío si no quieres un límite."
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Perfil público"
            subtitle="Comparte tus estadísticas con quien quieras"
            icon={<Globe className="size-4" aria-hidden />}
          />
          <div className="flex flex-col gap-1">
            <Toggle
              checked={isPublic}
              onChange={setIsPublic}
              label="Activar perfil público"
              description="Cualquiera con el enlace podrá ver tus estadísticas, sin poder editarlas."
            />
            <Toggle
              checked={showHistory}
              onChange={setShowHistory}
              label="Mostrar historial de cafés"
              disabled={!isPublic}
            />
            <Toggle
              checked={showCharts}
              onChange={setShowCharts}
              label="Mostrar gráficos"
              disabled={!isPublic}
            />
            <Toggle
              checked={showAchievements}
              onChange={setShowAchievements}
              label="Mostrar logros"
              disabled={!isPublic}
            />
            <Toggle
              checked={showAdvancedStats}
              onChange={setShowAdvancedStats}
              label="Mostrar estadísticas avanzadas"
              disabled={!isPublic}
            />
            {isPublic && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-coffee-50 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs text-coffee-700">{publicUrl}</code>
                <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}
        {saved && <Alert variant="success">Ajustes guardados correctamente.</Alert>}

        <div>
          <Button type="submit" size="lg" loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader
          title="Exportar datos"
          subtitle={`${coffees.length} cafés registrados`}
          icon={<Download className="size-4" aria-hidden />}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => exportToCsv(coffees)}
            disabled={coffees.length === 0}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => exportToJson(coffees)}
            disabled={coffees.length === 0}
          >
            <FileJson className="size-4" aria-hidden />
            Exportar JSON
          </Button>
        </div>
      </Card>
    </div>
  );
}
