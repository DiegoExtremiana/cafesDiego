/** Un café registrado. taken_at es la única fuente de verdad temporal. */
export interface Coffee {
  id: string;
  userId: string;
  takenAt: Date;
}
