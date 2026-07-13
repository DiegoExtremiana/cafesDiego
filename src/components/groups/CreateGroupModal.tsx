import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { UserAutocomplete } from './UserAutocomplete';
import { createGroup, inviteToGroup } from '@/services/groupService';
import type { UserSearchResult } from '@/types/group';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  /** Se llama tras crear el grupo para recargar la lista. */
  onCreated: () => void;
}

/** Modal de creación de grupo: nombre + invitados con autocompletado. */
export function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [invitees, setInvitees] = useState<UserSearchResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setInvitees([]);
    setError(null);
    setWarning(null);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const addInvitee = (user: UserSearchResult) => {
    setInvitees((current) =>
      current.some((invitee) => invitee.id === user.id) ? current : [...current, user],
    );
  };

  const removeInvitee = (id: string) => {
    setInvitees((current) => current.filter((invitee) => invitee.id !== id));
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    setWarning(null);
    try {
      const groupId = await createGroup(trimmed);
      const failed: string[] = [];
      for (const invitee of invitees) {
        try {
          await inviteToGroup(groupId, invitee.username);
        } catch {
          failed.push(invitee.username);
        }
      }
      onCreated();
      if (failed.length > 0) {
        setWarning(
          `El grupo se creó, pero no se pudo invitar a: ${failed.map((u) => `@${u}`).join(', ')}.`,
        );
        setSaving(false);
      } else {
        reset();
        setSaving(false);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo.');
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Crear un grupo" onClose={close}>
      <div className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}
        {warning && <Alert variant="info">{warning}</Alert>}

        <Input
          label="Nombre del grupo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="La oficina cafeinada"
          maxLength={40}
          autoFocus
        />

        <div className="flex flex-col gap-2">
          <UserAutocomplete
            label="Invitar a personas"
            placeholder="Escribe un nombre de usuario…"
            onSelect={addInvitee}
            excludeIds={invitees.map((invitee) => invitee.id)}
          />
          {invitees.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {invitees.map((invitee) => (
                <li
                  key={invitee.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-coffee-100 py-1 pl-3 pr-1.5 text-sm text-coffee-800"
                >
                  <span className="truncate">{invitee.displayName || invitee.username}</span>
                  <button
                    type="button"
                    onClick={() => removeInvitee(invitee.id)}
                    aria-label={`Quitar a ${invitee.username}`}
                    className="rounded-full p-0.5 text-coffee-400 transition-colors hover:bg-white hover:text-red-600"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-coffee-400">
            Recibirán una invitación que podrán aceptar o rechazar.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} loading={saving} disabled={!name.trim()}>
            <UserPlus className="size-4" aria-hidden />
            Crear grupo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
