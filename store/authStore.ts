import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  supabaseUser: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) =>
    set({ session, supabaseUser: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      supabaseUser: data.session?.user ?? null,
      isInitialized: true,
    });

    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      set({ profile });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, supabaseUser: session?.user ?? null });

      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ profile });
      } else {
        set({ profile: null });
      }
    });
  },

  reset: () =>
    set({
      session: null,
      supabaseUser: null,
      profile: null,
      isLoading: false,
    }),
}));
