/** Rol de un miembro dentro de un grupo. */
export type GroupRole = 'owner' | 'coadmin' | 'member';

/** Grupo de amigos para comparar el consumo de cafeína. */
export interface Group {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  /** Rol del usuario actual en este grupo. */
  myRole: GroupRole;
  /** Puesto del usuario actual (1 = quien menos cafeína bebe). */
  myRank: number;
  createdAt: Date;
}

/** Fila del ranking de un grupo (un miembro), en mg de cafeína y nº de bebidas. */
export interface RankingEntry {
  userId: string;
  username: string;
  displayName: string;
  role: GroupRole;
  todayMg: number;
  weekMg: number;
  totalMg: number;
  todayDrinks: number;
  weekDrinks: number;
  totalDrinks: number;
}

/** Un punto (miembro × semana) de la serie semanal comparativa del grupo. */
export interface WeeklySeriesPoint {
  userId: string;
  username: string;
  displayName: string;
  /** Lunes de la semana, clave YYYY-MM-DD. */
  weekStart: string;
  mg: number;
}

/** Un punto (miembro × día) de la serie diaria comparativa del grupo. */
export interface DailySeriesPoint {
  userId: string;
  username: string;
  displayName: string;
  /** Día, clave YYYY-MM-DD. */
  day: string;
  mg: number;
}

/** Invitación pendiente a un grupo. */
export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterUsername: string;
  inviterDisplayName: string;
  createdAt: Date;
}

/** Resultado del buscador de usuarios. */
export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  isPublic: boolean;
}

/** Mensaje del chat de un grupo. */
export interface GroupMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  body: string;
  createdAt: Date;
}
