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

  setInProgress: (trainingId) =>
    set((s) => ({
      statusByTrainingId: {
        ...s.statusByTrainingId,
        [trainingId]: 'in_progress',
      },
    })),
}));
