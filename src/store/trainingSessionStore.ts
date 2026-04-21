/**
 * In-memory (non-persisted) store for training completions in the current
 * app session. Gives the Results tab and training-list badges instant,
 * auth-independent feedback — no waiting for the backend response.
 *
 * Backend sync still happens in the background; this store just ensures
 * the UI is never stuck on "Complete your first session" right after the
 * user just completed one.
 */

import { create } from 'zustand';

export interface SessionRun {
  id: string;
  trainingId: string;
  trainingName: string;
  trainingSlug?: string;
  programSlug?: string;
  completedAt: string;
  totalSeconds: number;
  completed: boolean;
}

interface TrainingSessionState {
  runs: SessionRun[];
  statusByTrainingId: Record<string, 'completed' | 'in_progress'>;
  addRun: (run: SessionRun) => void;
  removeRun: (id: string) => void;
  updateRunId: (localId: string, backendId: string) => void;
  setInProgress: (trainingId: string) => void;
}

export const useTrainingSessionStore = create<TrainingSessionState>((set) => ({
  runs: [],
  statusByTrainingId: {},

  addRun: (run) =>
    set((s) => ({
      runs: [run, ...s.runs].slice(0, 50),
      statusByTrainingId: {
        ...s.statusByTrainingId,
        [run.trainingId]: run.completed ? 'completed' : 'in_progress',
      },
    })),

  removeRun: (id) =>
    set((s) => ({ runs: s.runs.filter((r) => r.id !== id) })),

  updateRunId: (localId, backendId) =>
    set((s) => ({
      runs: s.runs.map((r) => r.id === localId ? { ...r, id: backendId } : r),
    })),

  setInProgress: (trainingId) =>
    set((s) => ({
      statusByTrainingId: {
        ...s.statusByTrainingId,
        [trainingId]: 'in_progress',
      },
    })),
}));
