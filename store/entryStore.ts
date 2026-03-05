import { create } from 'zustand';
import { Entry, MoodTag } from '@/types';
import { getEntries, createEntry, deleteEntry, uploadEntryPhoto } from '@/lib/supabase/entries';
import { supabase } from '@/lib/supabase/client';

interface EntryDraft {
  text: string;
  moodTags: MoodTag[];
  photoUri: string | null;
}

interface EntryState {
  entries: Entry[];
  draft: EntryDraft;
  currentEntry: Entry | null;
  isGenerating: boolean;
  isLoading: boolean;
  lastError: string | null;

  setDraft: (draft: Partial<EntryDraft>) => void;
  resetDraft: () => void;
  fetchEntries: () => Promise<void>;
  createAndGenerateEntry: () => Promise<Entry | null>;
  setCurrentEntry: (entry: Entry | null) => void;
  updateEntry: (entry: Entry) => void;
  removeEntry: (entryId: string) => Promise<void>;
}

const initialDraft: EntryDraft = {
  text: '',
  moodTags: [],
  photoUri: null,
};

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  draft: initialDraft,
  currentEntry: null,
  isGenerating: false,
  isLoading: false,
  lastError: null,

  setDraft: (draft) =>
    set((state) => ({ draft: { ...state.draft, ...draft } })),

  resetDraft: () => set({ draft: initialDraft }),

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const { entries } = await getEntries();
      set({ entries: entries ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createAndGenerateEntry: async () => {
    const { draft } = get();
    if (!draft.text || draft.moodTags.length === 0) return null;

    set({ isGenerating: true, lastError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 写真をアップロード
      const photoUrl = draft.photoUri && user
        ? await uploadEntryPhoto(draft.photoUri, user.id)
        : null;

      // エントリを作成
      const { entry, error } = await createEntry({
        text: draft.text,
        mood_tags: draft.moodTags,
        photo_url: photoUrl ?? undefined,
      });

      if (error || !entry) throw error ?? new Error('エントリー作成失敗');

      const finalEntry = entry as Entry;
      set((state) => ({
        entries: [finalEntry, ...state.entries],
        currentEntry: finalEntry,
      }));
      return finalEntry;
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー';
      console.error('Entry creation error:', message);
      set({ lastError: message });
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  updateEntry: (entry) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
      currentEntry:
        state.currentEntry?.id === entry.id ? entry : state.currentEntry,
    })),

  removeEntry: async (entryId: string) => {
    await deleteEntry(entryId);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
      currentEntry: state.currentEntry?.id === entryId ? null : state.currentEntry,
    }));
  },
}));
