import { create } from 'zustand';
import { Pair, User } from '@/types';
import { getMyPair } from '@/lib/supabase/pairs';

interface PairWithUsers extends Pair {
  user1?: Partial<User>;
  user2?: Partial<User>;
}

interface PairState {
  pair: PairWithUsers | null;
  partner: Partial<User> | null;
  isLoading: boolean;
  fetchPair: (currentUserId: string) => Promise<void>;
  setPair: (pair: PairWithUsers | null) => void;
  reset: () => void;
}

export const usePairStore = create<PairState>((set, get) => ({
  pair: null,
  partner: null,
  isLoading: false,

  fetchPair: async (currentUserId: string) => {
    set({ isLoading: true });
    try {
      const { pair } = await getMyPair();
      if (pair) {
        const partner =
          pair.user_id_1 === currentUserId
            ? (pair as any).user2
            : (pair as any).user1;
        set({ pair: pair as any, partner });
      } else {
        set({ pair: null, partner: null });
      }
    } catch {
      set({ pair: null, partner: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setPair: (pair) => set({ pair }),

  reset: () => set({ pair: null, partner: null, isLoading: false }),
}));
