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
    const { data } = await apiClient.get<TrainBlock[]>(endpoints.train.blocks, {
      params,
    });
    return data;
  },

  getProgramTrainings: async (
    slug: string,
    params?: ProgramTrainingsParams,
  ): Promise<TrainingListItem[]> => {
    const { data } = await apiClient.get<TrainingListItem[]>(
      endpoints.train.programTrainings(slug),
      { params },
    );
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
    const { data } = await apiClient.get<TrainingDetail[]>(
      endpoints.train.private,
    );
    return data;
  },

  createPrivateTraining: async (
    payload: CreatePrivateTrainingPayload,
  ): Promise<TrainingDetail> => {
    const { data } = await apiClient.post<TrainingDetail>(
      endpoints.train.private,
      payload,
    );
    return data;
  },

  saveRun: async (
    payload: CreateTrainingRunPayload,
  ): Promise<void> => {
    await apiClient.post(endpoints.train.runs, payload);
  },
};
