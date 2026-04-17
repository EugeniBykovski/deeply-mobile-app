import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';

export type VisualizationMode = 'timer' | 'snake';

// ─── FileSystem storage (same pattern as onboardingStore) ─────────────────────

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
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const path = fsDir + encodeURIComponent(key) + '.json';
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) await FileSystem.deleteAsync(path);
    } catch {}
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface TrainingPrefsState {
  visualizationMode: VisualizationMode;
  setVisualizationMode: (mode: VisualizationMode) => void;
}

export const useTrainingPrefsStore = create<TrainingPrefsState>()(
  persist(
    (set) => ({
      visualizationMode: 'timer',
      setVisualizationMode: (mode) => set({ visualizationMode: mode }),
    }),
    {
      name: 'deeply-training-prefs',
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);
