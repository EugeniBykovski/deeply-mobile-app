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
}

export const useDiveSessionStore = create<DiveSessionState>((set) => ({
  runs: [],
  addRun: (run) =>
    set((s) => ({ runs: [run, ...s.runs].slice(0, 50) })),
}));
