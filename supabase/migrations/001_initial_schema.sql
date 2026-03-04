-- DiaryArt Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  premium_status TEXT NOT NULL DEFAULT 'free' CHECK (premium_status IN ('free', 'premium')),
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- PAIRS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'blocked')),
  blocked_by UUID REFERENCES public.users(id),
  paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dissolved_at TIMESTAMPTZ,
  -- Ensure 1:1 pairing: each user can only be in one active pair
  UNIQUE (user_id_1, user_id_2)
);

-- RLS for pairs
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pairs"
  ON public.pairs FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create pairs"
  ON public.pairs FOR INSERT
  WITH CHECK (auth.uid() = user_id_2);

CREATE POLICY "Users can update their own pairs"
  ON public.pairs FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ============================================================
-- ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (LENGTH(text) <= 140),
  mood_tags TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  generated_image_url TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  is_withdrawn BOOLEAN NOT NULL DEFAULT FALSE,
  withdrawn_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for entries
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entries"
  ON public.entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries"
  ON public.entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RECEIVED ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.received_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE
);

-- RLS for received_entries
ALTER TABLE public.received_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receivers can view their received entries"
  ON public.received_entries FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Senders can create received entries"
  ON public.received_entries FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update visibility"
  ON public.received_entries FOR UPDATE
  USING (auth.uid() = sender_id);

-- ============================================================
-- REACTIONS TABLE (MVP: table only, history later)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stamp_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id, user_id)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions"
  ON public.reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MONTHLY SUMMARIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair_id UUID NOT NULL REFERENCES public.pairs(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  entry_ids UUID[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_notified BOOLEAN NOT NULL DEFAULT FALSE,
  pdf_url TEXT,
  UNIQUE (pair_id, year, month)
);

ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can view summaries"
  ON public.monthly_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE id = pair_id
      AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    )
  );

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium_monthly', 'premium_yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('app_store', 'google_play')),
  transaction_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('received_entry', 'monthly_summary', 'pair_dissolved')),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create user record on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in the Supabase dashboard Storage section:
-- 1. Create bucket "diary-photos" (private)
-- 2. Create bucket "generated-artworks" (private)
-- 3. Create bucket "avatars" (public)

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_received_entries_receiver_id ON public.received_entries(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pairs_users ON public.pairs(user_id_1, user_id_2);
