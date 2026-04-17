import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  TrainBlock,
  TrainingListItem,
  TrainingDetail,
  CreatePrivateTrainingPayload,
  CreateTrainingRunPayload,
} from '../types';

export interface TrainBlocksParams {
  lang?: string;
}

export interface ProgramTrainingsParams {
  lang?: string;
}

export const trainService = {
  getBlocks: async (params?: TrainBlocksParams): Promise<TrainBlock[]> => {
    const { data } = await apiClient.get<{ blocks: TrainBlock[] }>(
      endpoints.train.blocks,
      { params },
    );
    return data.blocks;
  },

  getProgramTrainings: async (
    slug: string,
    params?: ProgramTrainingsParams,
  ): Promise<{ program: { key: string; slug: string }; items: TrainingListItem[] }> => {
    const { data } = await apiClient.get<{
      program: { key: string; slug: string };
      items: TrainingListItem[];
    }>(endpoints.train.programTrainings(slug), { params });
    return data;
  },

  getTraining: async (
    slug: string,
    params?: { lang?: string },
  ): Promise<TrainingDetail> => {
    const { data } = await apiClient.get<TrainingDetail>(
      endpoints.train.training(slug),
      { params },
    );
    return data;
  },

  getPrivateTrainings: async (): Promise<TrainingDetail[]> => {
    const { data } = await apiClient.get<{ items: TrainingDetail[] }>(
      endpoints.train.private,
    );
    return data.items;
  },

  createPrivateTraining: async (
    payload: CreatePrivateTrainingPayload,
  ): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>(
      endpoints.train.private,
      payload,
    );
    return data;
  },

  saveRun: async (payload: CreateTrainingRunPayload): Promise<{ id: string; startedAt: string }> => {
    const { data } = await apiClient.post<{ id: string; startedAt: string }>(
      endpoints.train.runs,
      payload,
    );
    return data;
  },

  updateRun: async (
    runId: string,
    payload: { completed?: boolean; totalSeconds?: number; metrics?: Record<string, unknown> },
  ): Promise<void> => {
    await apiClient.patch(endpoints.train.run(runId), payload);
  },
};
