// User types
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  premium_status: 'free' | 'premium';
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Pair types
export type PairStatus = 'active' | 'dissolved' | 'blocked';

export interface Pair {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: PairStatus;
  blocked_by: string | null;
  paired_at: string;
  dissolved_at: string | null;
}

// Entry / Diary types
export type MoodTag =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'tired'
  | 'peaceful'
  | 'anxious'
  | 'grateful'
  | 'nostalgic';

export type EntryVisibility = 'private' | 'shared';

export interface Entry {
  id: string;
  user_id: string;
  text: string;
  mood_tags: MoodTag[];
  photo_url: string | null;
  generated_image_url: string | null;
  is_shared: boolean;
  shared_at: string | null;
  is_withdrawn: boolean;
  withdrawn_at: string | null;
  visibility: EntryVisibility;
  created_at: string;
  updated_at: string;
}

// Received entry type
export interface ReceivedEntry {
  id: string;
  entry_id: string;
  sender_id: string;
  receiver_id: string;
  received_at: string;
  is_visible: boolean;
  entry?: Entry;
  sender?: User;
}

// Reaction types
export type StampType = 'heart' | 'smile' | 'wow' | 'hug' | 'star' | 'flower';

export interface Reaction {
  id: string;
  entry_id: string;
  user_id: string;
  stamp_type: StampType;
  created_at: string;
}

// Monthly summary types
export interface MonthlySummary {
  id: string;
  pair_id: string;
  year: number;
  month: number;
  entry_ids: string[];
  generated_at: string;
  is_notified: boolean;
  pdf_url: string | null;
}

// Subscription types
export type PlanType = 'free' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type StoreType = 'app_store' | 'google_play';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  store: StoreType;
  transaction_id: string;
  created_at: string;
  updated_at: string;
}

// Notification types
export type NotificationType =
  | 'received_entry'
  | 'monthly_summary'
  | 'pair_dissolved';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// User settings type
export interface UserSettings {
  withdrawal_notification: boolean;
  dissolution_notification: boolean;
  received_entry_notification: boolean;
  monthly_summary_notification: boolean;
}
