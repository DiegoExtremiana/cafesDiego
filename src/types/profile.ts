/** Perfil de usuario con su configuración personal y de privacidad. */
export interface Profile {
  id: string;
  username: string;
  displayName: string;
  /** Hora de entrada en formato HH:MM. */
  workStart: string;
  /** Hora de salida en formato HH:MM. */
  workEnd: string;
  /** Días laborables en formato ISO: 1 = lunes ... 7 = domingo. */
  workDays: number[];
  /** Máximo recomendado de cafés al día; null si no está configurado. */
  maxDailyCoffees: number | null;
  isPublic: boolean;
  showHistory: boolean;
  showCharts: boolean;
  showAchievements: boolean;
  showAdvancedStats: boolean;
  createdAt: Date;
}

/** Campos editables del perfil desde la página de ajustes. */
export type ProfileSettings = Omit<Profile, 'id' | 'createdAt'>;
