import { create } from 'zustand';
import { Entry, MoodTag } from '@/types';
import { getEntries, createEntry, updateEntryImage, deleteEntry } from '@/lib/supabase/entries';
import { generateWatercolorImage } from '@/lib/openai';
import { supabase } from '@/lib/supabase/client';

interface EntryDraft {
  text: string;
  moodTags: MoodTag[];
  photoUri: string | null;
  imageInstruction: string;
}

interface EntryState {
  entries: Entry[];
  draft: EntryDraft;
  currentEntry: Entry | null;
  isGenerating: boolean;
  isLoading: boolean;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;

  setDraft: (draft: Partial<EntryDraft>) => void;
  resetDraft: () => void;
  fetchEntries: () => Promise<void>;
  createAndGenerateEntry: () => Promise<Entry | null>;
  retryGenerate: (entryId: string) => Promise<string | null>;
  setCurrentEntry: (entry: Entry | null) => void;
  updateEntry: (entry: Entry) => void;
  removeEntry: (entryId: string) => Promise<void>;
}

const initialDraft: EntryDraft = {
  text: '',
  moodTags: [],
  photoUri: null,
  imageInstruction: '',
};

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  draft: initialDraft,
  currentEntry: null,
  isGenerating: false,
  isLoading: false,
  retryCount: 0,
  maxRetries: 1, // Updated based on premium status
  lastError: null,

  setDraft: (draft) =>
    set((state) => ({ draft: { ...state.draft, ...draft } })),

  resetDraft: () => set({ draft: initialDraft, retryCount: 0 }),

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

    set({ isGenerating: true, retryCount: 0, lastError: null });
    try {
      // Create the entry
      const { entry, error } = await createEntry({
        text: draft.text,
        mood_tags: draft.moodTags,
        photo_url: undefined, // Handle photo upload separately
      });

      if (error || !entry) throw error ?? new Error('エントリー作成失敗');

      // Generate watercolor image
      const imageUrl = await generateWatercolorImage(
        draft.text,
        draft.moodTags,
        undefined,
        draft.imageInstruction || undefined
      );

      // Update entry with generated image
      const { entry: updatedEntry } = await updateEntryImage(entry.id, imageUrl);

      const finalEntry = updatedEntry ?? entry;
      set((state) => ({
        entries: [finalEntry as Entry, ...state.entries],
        currentEntry: finalEntry as Entry,
      }));

      return finalEntry as Entry;
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー';
      console.error('Entry creation error:', message);
      set({ lastError: message });
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },

  retryGenerate: async (entryId: string) => {
    const { retryCount, maxRetries, currentEntry } = get();
    if (retryCount >= maxRetries || !currentEntry) return null;

    set({ isGenerating: true });
    try {
      const imageUrl = await generateWatercolorImage(
        currentEntry.text,
        currentEntry.mood_tags as MoodTag[]
      );
      await updateEntryImage(entryId, imageUrl);
      set((state) => ({
        retryCount: state.retryCount + 1,
        currentEntry: state.currentEntry
          ? { ...state.currentEntry, generated_image_url: imageUrl }
          : null,
        entries: state.entries.map((e) =>
          e.id === entryId ? { ...e, generated_image_url: imageUrl } : e
        ),
      }));
      return imageUrl;
    } catch {
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
