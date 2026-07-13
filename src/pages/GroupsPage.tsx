import { useCallback, useEffect, useState } from 'react';
import { Check, Mail, Users, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupSearchBar } from '@/components/groups/GroupSearchBar';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { GroupListItem } from '@/components/groups/GroupListItem';
import { GroupDetailModal } from '@/components/groups/GroupDetailModal';
import { useAuth } from '@/hooks/useAuth';
import { listMyGroups, listMyInvitations, respondInvitation } from '@/services/groupService';
import type { Group, GroupInvitation } from '@/types/group';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
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

  // El grupo abierto se toma siempre de la lista recargada, para que refleje
  // cambios de rol/miembros al instante.
  const openGroup = groups?.find((group) => group.id === openGroupId) ?? null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-coffee-900">Grupos</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <GroupSearchBar
        myGroups={groups ?? []}
        onOpenGroup={(group) => setOpenGroupId(group.id)}
        onCreateClick={() => setCreateOpen(true)}
      />

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

      {groups === null ? (
        <Spinner label="Cargando grupos..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" aria-hidden />}
          title="Todavía no estás en ningún grupo"
          description="Crea uno con el botón + e invita a tus amigos, o espera a que te inviten para empezar a compararos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupListItem key={group.id} group={group} onOpen={() => setOpenGroupId(group.id)} />
          ))}
        </div>
      )}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      <GroupDetailModal
        open={openGroupId !== null}
        group={openGroup}
        currentUserId={user?.id ?? null}
        onClose={() => setOpenGroupId(null)}
        onChanged={load}
      />
    </div>
  );
}
