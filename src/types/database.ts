/**
 * Tipos de la base de datos de Supabase.
 * Reflejan el esquema definido en supabase/schema.sql.
 * Nota: deben ser type alias (no interface) para satisfacer los
 * genéricos de supabase-js, que exigen index signatures implícitas.
 */

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  work_start: string;
  work_end: string;
  work_days: number[];
  max_daily_coffees: number | null;
  max_daily_caffeine: number | null;
  caffeine_limit_unit: string;
  is_public: boolean;
  show_history: boolean;
  show_charts: boolean;
  show_achievements: boolean;
  show_advanced_stats: boolean;
  created_at: string;
};

export type ProfileInsert = Omit<ProfileRow, 'created_at' | 'caffeine_limit_unit'> & {
  created_at?: string;
  caffeine_limit_unit?: string;
};

export type ProfileUpdate = Partial<Omit<ProfileRow, 'id' | 'created_at'>>;

export type CoffeeRow = {
  id: string;
  user_id: string;
  taken_at: string;
  type: string;
  has_caffeine: boolean;
  created_at: string;
};

export type CoffeeInsert = {
  user_id: string;
  taken_at: string;
  type?: string;
  has_caffeine?: boolean;
  id?: string;
  created_at?: string;
};

export type CoffeeUpdate = {
  taken_at?: string;
  type?: string;
  has_caffeine?: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      coffees: {
        Row: CoffeeRow;
        Insert: CoffeeInsert;
        Update: CoffeeUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_user_account: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      username_available: {
        Args: { check_username: string };
        Returns: boolean;
      };
      email_registered: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
