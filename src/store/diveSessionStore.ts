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
  /** Mirrors trainingSessionStore pattern — instant badge feedback without waiting for backend. */
  statusByDiveId: Record<string, 'completed' | 'in_progress'>;
  addRun: (run: DiveSessionRun) => void;
  removeRun: (id: string) => void;
  updateRunId: (localId: string, backendId: string) => void;
  setDiveInProgress: (templateId: string) => void;
}

export const useDiveSessionStore = create<DiveSessionState>((set) => ({
  runs: [],
  statusByDiveId: {},

  addRun: (run) =>
    set((s) => ({
      runs: [run, ...s.runs].slice(0, 50),
      statusByDiveId: {
        ...s.statusByDiveId,
        [run.templateId]: run.completed ? 'completed' : 'in_progress',
      },
    })),

  removeRun: (id) =>
    set((s) => ({ runs: s.runs.filter((r) => r.id !== id) })),

  updateRunId: (localId, backendId) =>
    set((s) => ({
      runs: s.runs.map((r) => r.id === localId ? { ...r, id: backendId } : r),
    })),

  setDiveInProgress: (templateId) =>
    set((s) => ({
      statusByDiveId: {
        ...s.statusByDiveId,
        [templateId]: 'in_progress',
      },
    })),
}));
