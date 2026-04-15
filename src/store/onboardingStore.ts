import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import type { SupportedLanguage } from '@/i18n';

// ─── FileSystem-based storage adapter (new-arch compatible) ──────────────────

const fsDir = FileSystem.documentDirectory + 'store/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(fsDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(fsDir, { intermediates: true });
  }
}

const fsStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      await ensureDir();
      const path = fsDir + encodeURIComponent(key) + '.json';
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(path);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await ensureDir();
      const path = fsDir + encodeURIComponent(key) + '.json';
      await FileSystem.writeAsStringAsync(path, value);
    } catch {
      // Non-fatal — state won't persist this write
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const path = fsDir + encodeURIComponent(key) + '.json';
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) await FileSystem.deleteAsync(path);
    } catch {
      // Non-fatal
    }
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingGoal =
  | 'stress'
  | 'breathing'
  | 'training'
  | 'oxygen'
  | 'freediving'
  | 'sleep';

export type SessionMode = '5' | '10' | '20' | '40';

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'regular'
  | 'pro';

export interface OnboardingData {
  goals: OnboardingGoal[];
  sessionMode: SessionMode | null;
  wantsNotes: boolean | null;
  level: ExperienceLevel | null;
}

interface OnboardingState {
  isCompleted: boolean;
  language: SupportedLanguage;
  data: OnboardingData;

  // Actions
  setGoals: (goals: OnboardingGoal[]) => void;
  setSessionMode: (mode: SessionMode) => void;
  setWantsNotes: (wants: boolean) => void;
  setLevel: (level: ExperienceLevel) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  complete: () => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  goals: [],
  sessionMode: null,
  wantsNotes: null,
  level: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isCompleted: false,
      language: 'en',
      data: initialData,

      setGoals: (goals) =>
        set((s) => ({ data: { ...s.data, goals } })),

      setSessionMode: (sessionMode) =>
        set((s) => ({ data: { ...s.data, sessionMode } })),

      setWantsNotes: (wantsNotes) =>
        set((s) => ({ data: { ...s.data, wantsNotes } })),

      setLevel: (level) =>
        set((s) => ({ data: { ...s.data, level } })),

      setLanguage: (language) => set({ language }),

      complete: () => set({ isCompleted: true }),

      reset: () => set({ isCompleted: false, data: initialData }),
    }),
    {
      name: 'deeply-onboarding',
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);
