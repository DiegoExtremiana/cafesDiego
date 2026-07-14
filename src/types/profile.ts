/** Unidad en la que el usuario expresa su límite diario de cafeína. */
export type CaffeineLimitUnit = 'cafes' | 'mg';

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
  /**
   * Si está activo, los límites de cafeína y bebidas solo cuentan los cafés
   * registrados dentro del horario laboral; los de fuera quedan en el
   * histórico, gráficos y grupos pero no cuentan para el límite.
   */
  workScheduleEnabled: boolean;
  /** Máximo recomendado de bebidas al día; null si no está configurado. */
  maxDailyCoffees: number | null;
  /** Máximo recomendado de cafeína al día en mg; null si no está configurado. */
  maxDailyCaffeine: number | null;
  /** Modo en el que se introduce y muestra el límite de cafeína. */
  caffeineLimitUnit: CaffeineLimitUnit;
  /** URL pública de la foto de perfil; null si usa el avatar por defecto. */
  avatarUrl: string | null;
  isPublic: boolean;
  showHistory: boolean;
  showCharts: boolean;
  showAchievements: boolean;
  showAdvancedStats: boolean;
  createdAt: Date;
}

/** Campos editables del perfil desde la página de ajustes. */
export type ProfileSettings = Omit<Profile, 'id' | 'createdAt'>;
