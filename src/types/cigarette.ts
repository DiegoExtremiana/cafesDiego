/** Un cigarro registrado. smoked_at es la única fuente de verdad temporal. */
export interface Cigarette {
  id: string;
  userId: string;
  smokedAt: Date;
}
