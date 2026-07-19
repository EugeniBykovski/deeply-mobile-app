import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fileSystemStorage as fsStorage } from '@/shared/lib/fileSystemStorage';
import type { SupportedLanguage } from '@/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Bump when onboarding content changes materially — recorded on completion
 *  so a future rebuild can compare against what a user actually saw. */
export const ONBOARDING_VERSION = 2;

export type OnboardingGoal =
  | 'stress'
  | 'breathing'
  | 'training'
  | 'oxygen'
  | 'freediving'
  | 'sleep';

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'regular'
  | 'pro';

export interface OnboardingData {
  goals: OnboardingGoal[];
  level: ExperienceLevel | null;
}

interface OnboardingState {
  /** True once the persist middleware has finished reading from FileSystem. */
  _hasHydrated: boolean;

  /** True once the user has finished the onboarding questionnaire flow. */
  isCompleted: boolean;
  /** ONBOARDING_VERSION at the time isCompleted was last set true. */
  completedOnboardingVersion: number | null;

  /**
   * True once the user has successfully authenticated via Apple Sign-In
   * at least once on this device. This flag is NEVER cleared by sign-out
   * or `clearAuth()` — it represents device-level account history and is
   * used to route returning users directly to the sign-in screen instead
   * of repeating the onboarding questionnaire.
   */
  hasEverSignedIn: boolean;

  /** Explicit acknowledgement of the apnea/hyperventilation safety guidance
   *  shown during onboarding — required before onboarding can complete. */
  safetyAcknowledged: boolean;

  language: SupportedLanguage;
  data: OnboardingData;

  // Actions
  setGoals: (goals: OnboardingGoal[]) => void;
  setLevel: (level: ExperienceLevel) => void;
  setSafetyAcknowledged: (acknowledged: boolean) => void;
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
  level: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      isCompleted: false,
      completedOnboardingVersion: null,
      hasEverSignedIn: false,
      safetyAcknowledged: false,
      language: 'en',
      data: initialData,

      setGoals: (goals) =>
        set((s) => ({ data: { ...s.data, goals } })),

      setLevel: (level) =>
        set((s) => ({ data: { ...s.data, level } })),

      setSafetyAcknowledged: (safetyAcknowledged) => set({ safetyAcknowledged }),

      setLanguage: (language) => set({ language }),

      complete: () => set({ isCompleted: true, completedOnboardingVersion: ONBOARDING_VERSION }),

      markSignedIn: () => set({ hasEverSignedIn: true }),

      // reset() intentionally preserves hasEverSignedIn — it is device history,
      // not questionnaire state.
      reset: () =>
        set({
          isCompleted: false,
          completedOnboardingVersion: null,
          safetyAcknowledged: false,
          data: initialData,
        }),

      // resetFull() clears everything including hasEverSignedIn, used after
      // account deletion so the user goes through the full onboarding flow.
      resetFull: () =>
        set({
          isCompleted: false,
          completedOnboardingVersion: null,
          hasEverSignedIn: false,
          safetyAcknowledged: false,
          data: initialData,
        }),
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
