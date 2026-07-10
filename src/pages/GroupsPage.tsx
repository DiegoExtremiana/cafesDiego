import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, Mail, Plus, Users, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupCard } from '@/components/groups/GroupCard';
import { useAuth } from '@/hooks/useAuth';
import {
  createGroup,
  listMyGroups,
  listMyInvitations,
  respondInvitation,
} from '@/services/groupService';
import type { Group, GroupInvitation } from '@/types/group';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [loadedGroups, loadedInvitations] = await Promise.all([
        listMyGroups(),
        listMyInvitations(),
      ]);
      setGroups(loadedGroups);
      setInvitations(loadedInvitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los grupos.');
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await createGroup(name);
      setNewName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo.');
    } finally {
      setCreating(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setRespondingId(invitationId);
    try {
      await respondInvitation(invitationId, accept);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo responder a la invitación.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-coffee-900">Grupos</h1>

      {error && <Alert variant="error">{error}</Alert>}

      {invitations.length > 0 && (
        <Card className="border-coffee-300 bg-coffee-50/60">
          <CardHeader
            title="Invitaciones pendientes"
            subtitle="Alguien quiere compararse contigo"
            icon={<Mail className="size-4" aria-hidden />}
          />
          <ul className="flex flex-col gap-2">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-coffee-900">
                    {invitation.groupName}
                  </p>
                  <p className="truncate text-xs text-coffee-400">
                    Invitación de {invitation.inviterDisplayName || invitation.inviterUsername}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={respondingId === invitation.id}
                    onClick={() => handleRespond(invitation.id, true)}
                  >
                    <Check className="size-3.5" aria-hidden />
                    Aceptar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={respondingId === invitation.id}
                    onClick={() => handleRespond(invitation.id, false)}
                  >
                    <X className="size-3.5" aria-hidden />
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Crear un grupo"
          subtitle="Invita a tus amigos y ved quién bebe más"
          icon={<Plus className="size-4" aria-hidden />}
        />
        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Nombre del grupo"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="La oficina cafeinada"
              maxLength={40}
            />
          </div>
          <Button type="submit" loading={creating} disabled={!newName.trim()}>
            <Plus className="size-4" aria-hidden />
            Crear
          </Button>
        </form>
      </Card>

      {groups === null ? (
        <Spinner label="Cargando grupos..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" aria-hidden />}
          title="Todavía no estás en ningún grupo"
          description="Crea uno e invita a tus amigos, o espera a que te inviten para empezar a compararos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              currentUserId={user?.id ?? null}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
