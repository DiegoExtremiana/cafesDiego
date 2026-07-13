import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  Check,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  Loader2,
  Trash2,
  User,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Toggle } from '@/components/ui/Toggle';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AvailabilityHint, type AvailabilityStatus } from '@/components/ui/AvailabilityHint';
import { WorkDaysSelector } from '@/components/settings/WorkDaysSelector';
import { AvatarManager } from '@/components/settings/AvatarManager';
import { useAuth } from '@/hooks/useAuth';
import { useCoffees } from '@/hooks/useCoffees';
import { isUsernameAvailable } from '@/services/availabilityService';
import { exportToCsv, exportToJson } from '@/utils/export';
import { ESPRESSO_MG } from '@/types/coffee';
import type { CaffeineLimitUnit, ProfileSettings } from '@/types/profile';

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;
const SAVE_DEBOUNCE_MS = 700;
const USERNAME_CHECK_DEBOUNCE_MS = 500;

interface FieldSnapshot {
  displayName: string;
  username: string;
  workStart: string;
  workEnd: string;
  workDays: number[];
  maxCoffees: string;
  maxCaffeine: string;
  maxCaffeineCafes: string;
  caffeineUnit: CaffeineLimitUnit;
}

function serialize(fields: FieldSnapshot): string {
  return JSON.stringify(fields);
}

/** mg equivalentes de un límite en cafés (redondeado a mg enteros). */
function cafesToMg(cafes: number): number {
  return Math.round(cafes * ESPRESSO_MG);
}

/** Cafés equivalentes de un límite en mg, ajustados al medio café más cercano. */
function mgToCafes(mg: number): number {
  return Math.round((mg / ESPRESSO_MG) * 2) / 2;
}

function validateFields(fields: FieldSnapshot):
  | { error: string }
  | { normalizedUsername: string; parsedMax: number | null; parsedMaxCaffeine: number | null } {
  const normalizedUsername = fields.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return {
      error:
        'El nombre de usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.',
    };
  }
  if (fields.workDays.length === 0) {
    return { error: 'Selecciona al menos un día laborable.' };
  }
  if (fields.workEnd <= fields.workStart) {
    return { error: 'La hora de salida debe ser posterior a la de entrada.' };
  }
  const parsedMax = fields.maxCoffees.trim() === '' ? null : Number(fields.maxCoffees);
  if (parsedMax !== null && (!Number.isInteger(parsedMax) || parsedMax < 1)) {
    return { error: 'El máximo de bebidas debe ser un número entero mayor que cero.' };
  }
  // El límite de cafeína se guarda siempre en mg; en modo cafés se convierte
  // (1 café = un espresso) y solo se admiten valores enteros o acabados en ,5.
  let parsedMaxCaffeine: number | null;
  if (fields.caffeineUnit === 'cafes') {
    const raw = fields.maxCaffeineCafes.trim();
    const parsed = raw === '' ? null : Number(raw.replace(',', '.'));
    if (
      parsed !== null &&
      (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed * 2))
    ) {
      return {
        error: 'El límite en cafés debe ser un número mayor que cero, entero o acabado en ,5.',
      };
    }
    parsedMaxCaffeine = parsed === null ? null : cafesToMg(parsed);
  } else {
    const parsed = fields.maxCaffeine.trim() === '' ? null : Number(fields.maxCaffeine);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1)) {
      return { error: 'El máximo de cafeína debe ser un número entero de mg mayor que cero.' };
    }
    parsedMaxCaffeine = parsed;
  }
  return { normalizedUsername, parsedMax, parsedMaxCaffeine };
}

export default function SettingsPage() {
  const { profile, updateProfile, deleteAccount } = useAuth();
  const { coffees } = useCoffees();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [workStart, setWorkStart] = useState('07:00');
  const [workEnd, setWorkEnd] = useState('14:00');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxCoffees, setMaxCoffees] = useState('');
  const [maxCaffeine, setMaxCaffeine] = useState('');
  const [maxCaffeineCafes, setMaxCaffeineCafes] = useState('');
  const [caffeineUnit, setCaffeineUnit] = useState<CaffeineLimitUnit>('cafes');
  const [isPublic, setIsPublic] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showAdvancedStats, setShowAdvancedStats] = useState(true);

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('idle');
  const usernameStatusRef = useRef<AvailabilityStatus>('idle');
  const usernameCheckId = useRef(0);

  const snapshotRef = useRef('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setStatus('idle'), 1800);
  };

  // Carga los valores del perfil solo la primera vez (evita pisar ediciones en curso).
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setWorkStart(profile.workStart);
    setWorkEnd(profile.workEnd);
    setWorkDays(profile.workDays);
    setMaxCoffees(profile.maxDailyCoffees !== null ? String(profile.maxDailyCoffees) : '');
    const initialMg = profile.maxDailyCaffeine !== null ? String(profile.maxDailyCaffeine) : '';
    const initialCafes =
      profile.maxDailyCaffeine !== null ? String(mgToCafes(profile.maxDailyCaffeine)) : '';
    setMaxCaffeine(initialMg);
    setMaxCaffeineCafes(initialCafes);
    setCaffeineUnit(profile.caffeineLimitUnit);
    setIsPublic(profile.isPublic);
    setShowHistory(profile.showHistory);
    setShowCharts(profile.showCharts);
    setShowAchievements(profile.showAchievements);
    setShowAdvancedStats(profile.showAdvancedStats);
    snapshotRef.current = serialize({
      displayName: profile.displayName,
      username: profile.username,
      workStart: profile.workStart,
      workEnd: profile.workEnd,
      workDays: profile.workDays,
      maxCoffees: profile.maxDailyCoffees !== null ? String(profile.maxDailyCoffees) : '',
      maxCaffeine: initialMg,
      maxCaffeineCafes: initialCafes,
      caffeineUnit: profile.caffeineLimitUnit,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Comprueba en tiempo real que el nombre de usuario elegido esté libre (salvo que sea el actual).
  useEffect(() => {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized) || normalized === profile?.username) {
      usernameStatusRef.current = 'idle';
      setUsernameStatus('idle');
      return;
    }
    usernameStatusRef.current = 'checking';
    setUsernameStatus('checking');
    const id = ++usernameCheckId.current;
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(normalized);
        if (usernameCheckId.current === id) {
          const next = available ? 'available' : 'taken';
          usernameStatusRef.current = next;
          setUsernameStatus(next);
        }
      } catch {
        if (usernameCheckId.current === id) {
          usernameStatusRef.current = 'idle';
          setUsernameStatus('idle');
        }
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Autoguardado: espera a que el usuario pare de escribir y guarda sin botón.
  useEffect(() => {
    const snapshot = serialize({
      displayName,
      username,
      workStart,
      workEnd,
      workDays,
      maxCoffees,
      maxCaffeine,
      maxCaffeineCafes,
      caffeineUnit,
    });
    if (snapshot === snapshotRef.current) return;

    const timer = setTimeout(async () => {
      if (usernameStatusRef.current === 'taken') {
        setStatus('error');
        setErrorMessage('Ese nombre de usuario ya está en uso.');
        return;
      }
      const result = validateFields({
        displayName,
        username,
        workStart,
        workEnd,
        workDays,
        maxCoffees,
        maxCaffeine,
        maxCaffeineCafes,
        caffeineUnit,
      });
      if ('error' in result) {
        setStatus('error');
        setErrorMessage(result.error);
        return;
      }
      setStatus('saving');
      setErrorMessage(null);
      try {
        await updateProfile({
          displayName: displayName.trim(),
          username: result.normalizedUsername,
          workStart,
          workEnd,
          workDays,
          maxDailyCoffees: result.parsedMax,
          maxDailyCaffeine: result.parsedMaxCaffeine,
          caffeineLimitUnit: caffeineUnit,
        });
        snapshotRef.current = snapshot;
        setStatus('saved');
        scheduleIdle();
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'No se pudieron guardar los ajustes.');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, username, workStart, workEnd, workDays, maxCoffees, maxCaffeine, maxCaffeineCafes, caffeineUnit]);

  if (!profile) return <Spinner label="Cargando ajustes..." />;

  const publicUrl = `${window.location.origin}${window.location.pathname}#/u/${username}`;

  // Equivalencias en vivo para rellenar el campo inhabilitado del otro modo.
  const parsedCafesInput = Number(maxCaffeineCafes.replace(',', '.'));
  const mgEquivalent =
    maxCaffeineCafes.trim() !== '' && Number.isFinite(parsedCafesInput) && parsedCafesInput > 0
      ? String(cafesToMg(parsedCafesInput))
      : '';
  const parsedMgInput = Number(maxCaffeine);
  const cafesEquivalent =
    maxCaffeine.trim() !== '' && Number.isFinite(parsedMgInput) && parsedMgInput > 0
      ? String(mgToCafes(parsedMgInput))
      : '';

  const handleCaffeineUnitChange = (unit: CaffeineLimitUnit) => {
    if (unit === caffeineUnit) return;
    // Al cambiar de modo, el campo que se activa hereda el equivalente del otro.
    if (unit === 'cafes') setMaxCaffeineCafes(cafesEquivalent);
    else setMaxCaffeine(mgEquivalent);
    setCaffeineUnit(unit);
  };

  const saveField = async (partial: Partial<ProfileSettings>) => {
    setStatus('saving');
    setErrorMessage(null);
    try {
      await updateProfile(partial);
      setStatus('saved');
      scheduleIdle();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex max-w-5xl flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-coffee-900">Ajustes</h1>
        <div className="flex items-center gap-1.5 text-xs text-coffee-400">
          {status === 'saving' && (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Guardando...
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="size-3.5 text-emerald-600" aria-hidden />
              Guardado
            </>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Perfil" icon={<User className="size-4" aria-hidden />} />
          <div className="flex flex-col gap-4">
            <AvatarManager />
            <Input
              label="Nombre"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Diego"
            />
            <div className="flex flex-col gap-1.5">
              <Input
                label="Nombre de usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                hint="Forma parte de la URL de tu perfil público."
              />
              <AvailabilityHint
                status={usernameStatus}
                takenMessage="Ese nombre de usuario ya está en uso"
                availableMessage="Nombre de usuario disponible"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Jornada laboral"
            subtitle="Se usa para calcular las horas trabajadas y tu ritmo"
            icon={<Briefcase className="size-4" aria-hidden />}
          />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              label="Máximo recomendado de bebidas al día"
              type="number"
              min={1}
              max={20}
              value={maxCoffees}
              onChange={(event) => setMaxCoffees(event.target.value)}
              placeholder="Sin límite"
              hint="Déjalo vacío si no quieres un límite."
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-coffee-800">
                  Máximo recomendado de cafeína al día
                </span>
                <div
                  className="inline-flex rounded-lg border border-coffee-200 bg-white p-0.5"
                  role="tablist"
                  aria-label="Unidad del límite de cafeína"
                >
                  {(
                    [
                      ['cafes', 'Cafés'],
                      ['mg', 'mg/día'],
                    ] as const
                  ).map(([unit, label]) => (
                    <button
                      key={unit}
                      type="button"
                      role="tab"
                      aria-selected={caffeineUnit === unit}
                      onClick={() => handleCaffeineUnitChange(unit)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        caffeineUnit === unit
                          ? 'bg-coffee-600 text-white'
                          : 'text-coffee-500 hover:bg-coffee-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Cafés"
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={caffeineUnit === 'cafes' ? maxCaffeineCafes : cafesEquivalent}
                  onChange={(event) => setMaxCaffeineCafes(event.target.value)}
                  disabled={caffeineUnit !== 'cafes'}
                  placeholder="Sin límite (p. ej. 3,5)"
                />
                <Input
                  label="mg/día"
                  type="number"
                  min={1}
                  max={2000}
                  value={caffeineUnit === 'mg' ? maxCaffeine : mgEquivalent}
                  onChange={(event) => setMaxCaffeine(event.target.value)}
                  disabled={caffeineUnit !== 'mg'}
                  placeholder="Sin límite (p. ej. 400)"
                />
              </div>
              <p className="text-xs text-coffee-400">
                Un café equivale a {ESPRESSO_MG} mg de cafeína. Se suelen recomendar hasta 400 mg
                diarios. Déjalo vacío si no quieres un límite.
              </p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Perfil público"
            subtitle="Comparte tus estadísticas con quien quieras"
            icon={<Globe className="size-4" aria-hidden />}
          />
          <div className="flex flex-col gap-1">
            <Toggle
              checked={isPublic}
              onChange={(checked) => {
                setIsPublic(checked);
                void saveField({ isPublic: checked });
              }}
              label="Activar perfil público"
              description="Cualquiera con el enlace podrá ver tus estadísticas, sin poder editarlas."
            />
            <Toggle
              checked={showHistory}
              onChange={(checked) => {
                setShowHistory(checked);
                void saveField({ showHistory: checked });
              }}
              label="Mostrar historial de cafés"
              disabled={!isPublic}
            />
            <Toggle
              checked={showCharts}
              onChange={(checked) => {
                setShowCharts(checked);
                void saveField({ showCharts: checked });
              }}
              label="Mostrar gráficos"
              disabled={!isPublic}
            />
            <Toggle
              checked={showAchievements}
              onChange={(checked) => {
                setShowAchievements(checked);
                void saveField({ showAchievements: checked });
              }}
              label="Mostrar logros"
              disabled={!isPublic}
            />
            <Toggle
              checked={showAdvancedStats}
              onChange={(checked) => {
                setShowAdvancedStats(checked);
                void saveField({ showAdvancedStats: checked });
              }}
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

        <Card className="border-red-200">
          <CardHeader
            title="Eliminar cuenta"
            subtitle="Esta acción no se puede deshacer"
            icon={<AlertTriangle className="size-4 text-red-500" aria-hidden />}
          />
          <div className="flex flex-col gap-3">
            {deleteError && <Alert variant="error">{deleteError}</Alert>}
            <p className="text-sm text-coffee-500">
              Se borrarán tu perfil, tu historial de cafés y todos tus datos asociados de forma
              permanente.
            </p>
            <div>
              <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="size-4" aria-hidden />
                Eliminar mi cuenta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar cuenta"
        message="Vas a borrar tu cuenta y todos tus datos de forma permanente. Esta acción no se puede deshacer. ¿Quieres continuar?"
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar cuenta'}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
