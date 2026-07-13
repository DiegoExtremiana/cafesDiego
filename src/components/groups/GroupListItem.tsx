import { ChevronRight, Crown, ShieldCheck, Trophy, Users } from 'lucide-react';
import type { Group } from '@/types/group';

interface GroupListItemProps {
  group: Group;
  onOpen: (group: Group) => void;
}

/** Fila de la lista de grupos: nombre + tu puesto en el ranking. */
export function GroupListItem({ group, onOpen }: GroupListItemProps) {
  const isWinner = group.myRank === 1 && group.memberCount > 1;

  return (
    <button
      type="button"
      onClick={() => onOpen(group)}
      className="flex w-full items-center gap-3 rounded-2xl border border-coffee-200 bg-white p-4 text-left transition-colors hover:border-coffee-300 hover:bg-coffee-50/60"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          isWinner ? 'bg-emerald-100 text-emerald-600' : 'bg-coffee-100 text-coffee-600'
        }`}
      >
        <Trophy className="size-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-coffee-900">
          {group.name}
          {group.myRole === 'owner' && (
            <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Eres el creador" />
          )}
          {group.myRole === 'coadmin' && (
            <ShieldCheck className="size-3.5 shrink-0 text-coffee-500" aria-label="Eres co-administrador" />
          )}
        </p>
        <p className="flex items-center gap-1 text-xs text-coffee-400">
          <Users className="size-3.5" aria-hidden />
          {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-coffee-400">Tu puesto</p>
        <p
          className={`text-sm font-bold tabular-nums ${
            isWinner ? 'text-emerald-600' : 'text-coffee-800'
          }`}
        >
          {group.myRank > 0 ? `${group.myRank}.º de ${group.memberCount}` : '—'}
        </p>
      </div>

      <ChevronRight className="size-4 shrink-0 text-coffee-300" aria-hidden />
    </button>
  );
}
