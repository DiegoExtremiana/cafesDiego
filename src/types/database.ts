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
  work_schedule_enabled: boolean;
  max_daily_coffees: number | null;
  max_daily_caffeine: number | null;
  caffeine_limit_unit: string;
  avatar_url: string | null;
  is_public: boolean;
  show_history: boolean;
  show_charts: boolean;
  show_achievements: boolean;
  show_advanced_stats: boolean;
  created_at: string;
};

export type ProfileInsert = Omit<
  ProfileRow,
  'created_at' | 'caffeine_limit_unit' | 'avatar_url' | 'work_schedule_enabled'
> & {
  created_at?: string;
  caffeine_limit_unit?: string;
  avatar_url?: string | null;
  work_schedule_enabled?: boolean;
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
      create_group: {
        Args: { group_name: string };
        Returns: string;
      };
      my_groups: {
        Args: { tz: string };
        Returns: {
          id: string;
          name: string;
          owner_id: string;
          member_count: number;
          my_role: string;
          my_rank: number;
          created_at: string;
        }[];
      };
      invite_to_group: {
        Args: { gid: string; invitee_username: string };
        Returns: undefined;
      };
      my_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          group_id: string;
          group_name: string;
          inviter_username: string;
          inviter_display_name: string;
          created_at: string;
        }[];
      };
      count_pending_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      respond_invitation: {
        Args: { invitation_id: string; accept: boolean };
        Returns: undefined;
      };
      leave_group: {
        Args: { gid: string };
        Returns: undefined;
      };
      delete_group: {
        Args: { gid: string };
        Returns: undefined;
      };
      group_ranking: {
        Args: { gid: string; tz: string };
        Returns: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_public: boolean;
          role: string;
          today_mg: number;
          week_mg: number;
          total_mg: number;
          today_drinks: number;
          week_drinks: number;
          total_drinks: number;
        }[];
      };
      group_weekly_series: {
        Args: { gid: string; tz: string; weeks?: number };
        Returns: {
          user_id: string;
          username: string;
          display_name: string;
          week_start: string;
          mg: number;
        }[];
      };
      group_daily_series: {
        Args: { gid: string; tz: string };
        Returns: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_public: boolean;
          day: string;
          mg: number;
        }[];
      };
      search_users: {
        Args: { q: string };
        Returns: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_public: boolean;
        }[];
      };
      post_group_message: {
        Args: { gid: string; body: string };
        Returns: string;
      };
      list_group_messages: {
        Args: { gid: string; lim?: number };
        Returns: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_public: boolean;
          body: string;
          created_at: string;
        }[];
      };
      set_member_role: {
        Args: { gid: string; target: string; new_role: string };
        Returns: undefined;
      };
      kick_member: {
        Args: { gid: string; target: string };
        Returns: undefined;
      };
      rename_group: {
        Args: { gid: string; new_name: string };
        Returns: undefined;
      };
      propose_group_name: {
        Args: { gid: string; new_name: string };
        Returns: undefined;
      };
      my_pending_name_request: {
        Args: { gid: string };
        Returns: string | null;
      };
      list_group_name_requests: {
        Args: { gid: string };
        Returns: {
          id: string;
          requested_by: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          proposed_name: string;
          created_at: string;
        }[];
      };
      respond_group_name_request: {
        Args: { req_id: string; approve: boolean };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
