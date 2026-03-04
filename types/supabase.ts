// Supabase Database type definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          premium_status: 'free' | 'premium';
          premium_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          premium_status?: 'free' | 'premium';
          premium_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          premium_status?: 'free' | 'premium';
          premium_expires_at?: string | null;
          updated_at?: string;
        };
      };
      pairs: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          status: 'active' | 'dissolved' | 'blocked';
          blocked_by: string | null;
          paired_at: string;
          dissolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          status?: 'active' | 'dissolved' | 'blocked';
          blocked_by?: string | null;
          paired_at?: string;
          dissolved_at?: string | null;
        };
        Update: {
          status?: 'active' | 'dissolved' | 'blocked';
          blocked_by?: string | null;
          dissolved_at?: string | null;
        };
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          mood_tags: string[];
          photo_url: string | null;
          generated_image_url: string | null;
          is_shared: boolean;
          shared_at: string | null;
          is_withdrawn: boolean;
          withdrawn_at: string | null;
          visibility: 'private' | 'shared';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          mood_tags?: string[];
          photo_url?: string | null;
          generated_image_url?: string | null;
          is_shared?: boolean;
          shared_at?: string | null;
          is_withdrawn?: boolean;
          withdrawn_at?: string | null;
          visibility?: 'private' | 'shared';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          text?: string;
          mood_tags?: string[];
          photo_url?: string | null;
          generated_image_url?: string | null;
          is_shared?: boolean;
          shared_at?: string | null;
          is_withdrawn?: boolean;
          withdrawn_at?: string | null;
          visibility?: 'private' | 'shared';
          updated_at?: string;
        };
      };
      received_entries: {
        Row: {
          id: string;
          entry_id: string;
          sender_id: string;
          receiver_id: string;
          received_at: string;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          entry_id: string;
          sender_id: string;
          receiver_id: string;
          received_at?: string;
          is_visible?: boolean;
        };
        Update: {
          is_visible?: boolean;
        };
      };
      reactions: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          stamp_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          stamp_type: string;
          created_at?: string;
        };
        Update: never;
      };
      monthly_summaries: {
        Row: {
          id: string;
          pair_id: string;
          year: number;
          month: number;
          entry_ids: string[];
          generated_at: string;
          is_notified: boolean;
          pdf_url: string | null;
        };
        Insert: {
          id?: string;
          pair_id: string;
          year: number;
          month: number;
          entry_ids?: string[];
          generated_at?: string;
          is_notified?: boolean;
          pdf_url?: string | null;
        };
        Update: {
          entry_ids?: string[];
          is_notified?: boolean;
          pdf_url?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: string;
          status: string;
          started_at: string;
          expires_at: string;
          store: string;
          transaction_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: string;
          status: string;
          started_at?: string;
          expires_at: string;
          store: string;
          transaction_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_type?: string;
          status?: string;
          expires_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
