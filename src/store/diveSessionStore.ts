import { create } from 'zustand';

export interface DiveSessionRun {
  id: string;
  templateId: string;
  templateSlug?: string;
  templateTitle: string;
  completedAt: string;
  holdSeconds: number;
  maxDepthReached: number;
  completed: boolean;
}

interface DiveSessionState {
  runs: DiveSessionRun[];
  addRun: (run: DiveSessionRun) => void;
  removeRun: (id: string) => void;
  updateRunId: (localId: string, backendId: string) => void;
}

export const useDiveSessionStore = create<DiveSessionState>((set) => ({
  runs: [],
  addRun: (run) =>
    set((s) => ({ runs: [run, ...s.runs].slice(0, 50) })),
  removeRun: (id) =>
    set((s) => ({ runs: s.runs.filter((r) => r.id !== id) })),
  updateRunId: (localId, backendId) =>
    set((s) => ({
      runs: s.runs.map((r) => r.id === localId ? { ...r, id: backendId } : r),
    })),
}));
