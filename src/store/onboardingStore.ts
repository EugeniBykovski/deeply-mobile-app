import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import type { SupportedLanguage } from '@/i18n';

// ─── FileSystem-based storage adapter (new-arch compatible) ──────────────────

const fsDir = ((FileSystem as any).documentDirectory ?? '') + 'store/';

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
  /** True once the persist middleware has finished reading from FileSystem. */
  _hasHydrated: boolean;

  /** True once the user has finished the onboarding questionnaire flow. */
  isCompleted: boolean;

  /**
   * True once the user has successfully authenticated via Apple Sign-In
   * at least once on this device. This flag is NEVER cleared by sign-out
   * or `clearAuth()` — it represents device-level account history and is
   * used to route returning users directly to the sign-in screen instead
   * of repeating the onboarding questionnaire.
   */
  hasEverSignedIn: boolean;

  language: SupportedLanguage;
  data: OnboardingData;

  // Actions
  setGoals: (goals: OnboardingGoal[]) => void;
  setSessionMode: (mode: SessionMode) => void;
  setWantsNotes: (wants: boolean) => void;
  setLevel: (level: ExperienceLevel) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  /** Marks onboarding questionnaire as complete. Does not imply sign-in. */
  complete: () => void;
  /**
   * Marks that the user has successfully authenticated with Apple at least
   * once. Call this after a successful Apple Sign-In on any screen.
   * This is intentionally separate from `complete()` — a user can complete
   * onboarding without signing in (skip), but `hasEverSignedIn` requires
   * an actual successful auth exchange.
   */
  markSignedIn: () => void;
  /** Resets questionnaire progress. Does NOT clear `hasEverSignedIn`. */
  reset: () => void;
  /**
   * Full reset — clears all onboarding state including `hasEverSignedIn`.
   * Use after account deletion so the user is routed through the full
   * onboarding + sign-up flow rather than the returning-user screen.
   */
  resetFull: () => void;
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
      _hasHydrated: false,
      isCompleted: false,
      hasEverSignedIn: false,
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

      markSignedIn: () => set({ hasEverSignedIn: true }),

      // reset() intentionally preserves hasEverSignedIn — it is device history,
      // not questionnaire state.
      reset: () => set({ isCompleted: false, data: initialData }),

      // resetFull() clears everything including hasEverSignedIn, used after
      // account deletion so the user goes through the full onboarding flow.
      resetFull: () => set({ isCompleted: false, hasEverSignedIn: false, data: initialData }),
    }),
    {
      name: 'deeply-onboarding',
      storage: createJSONStorage(() => fsStorage),
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

/** Resolves once the persist middleware has finished reading from FileSystem. */
export function waitForOnboardingHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useOnboardingStore.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsub = useOnboardingStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsub();
        resolve();
      }
    });
  });
}
