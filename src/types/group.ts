/** Grupo de amigos para comparar el consumo de cafeína. */
export interface Group {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  createdAt: Date;
}

/** Fila del ranking de un grupo (un miembro), en mg de cafeína y nº de bebidas. */
export interface RankingEntry {
  userId: string;
  username: string;
  displayName: string;
  todayMg: number;
  weekMg: number;
  totalMg: number;
  todayDrinks: number;
  weekDrinks: number;
  totalDrinks: number;
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
